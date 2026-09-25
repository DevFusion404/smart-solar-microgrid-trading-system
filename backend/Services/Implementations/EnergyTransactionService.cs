/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : EnergyTransactionService.cs
Description   : FAT service holding the complete energy transfer
                workflow — QR issue, QR verification, transfer
                completion, history, search and dashboards.
Author        : Malmi
=====================================================
*/

using backend.Data;
using backend.DTOs.Transactions;
using backend.Helpers;
using backend.Middleware;
using backend.Models;
using backend.Repositories;
using backend.Services.Interfaces;
using MongoDB.Driver;

namespace backend.Services.Implementations;

/// <summary>
/// Implements the final stage of the trading workflow: turning an approved
/// reservation into a scannable QR, validating that QR at the station, and
/// closing both the transaction and the reservation once the energy has
/// changed hands.
/// </summary>
public class EnergyTransactionService : IEnergyTransactionService
{
    /// <summary>
    /// Grace period after a slot ends during which the QR can still be scanned.
    /// Operators cannot always process a queue the moment a slot closes.
    /// </summary>
    private static readonly TimeSpan ExpiryGrace = TimeSpan.FromHours(2);

    /// <summary>Shortest life a freshly issued token is given, for same-slot bookings.</summary>
    private static readonly TimeSpan MinimumTokenLife = TimeSpan.FromMinutes(15);

    /// <summary>How many times a token collision is retried before giving up.</summary>
    private const int TokenCollisionRetries = 5;

    /// <summary>Number of rows each dashboard list returns.</summary>
    private const int DashboardListSize = 10;

    private readonly IEnergyTransactionRepository _transactions;
    private readonly IReservationLookupRepository _reservations;
    private readonly IUserRepository _users;
    private readonly IQrCodeGenerator _qrCodeGenerator;
    private readonly IMongoCollection<SolarStationInfo> _stations;
    private readonly IMongoCollection<EnergyBookingSlot> _slots;
    private readonly ILogger<EnergyTransactionService> _logger;

    /// <summary>Initializes the service with its repositories, helpers and read-only collection handles.</summary>
    /// <param name="transactions">Transaction persistence.</param>
    /// <param name="reservations">Read access to Component 3's reservations.</param>
    /// <param name="users">User lookups for NIC and display name resolution.</param>
    /// <param name="qrCodeGenerator">Token minting and QR rendering.</param>
    /// <param name="context">Shared MongoDB context, used for station and slot reads.</param>
    /// <param name="logger">Workflow logging.</param>
    public EnergyTransactionService(
        IEnergyTransactionRepository transactions,
        IReservationLookupRepository reservations,
        IUserRepository users,
        IQrCodeGenerator qrCodeGenerator,
        MongoDbContext context,
        ILogger<EnergyTransactionService> logger)
    {
        _transactions = transactions;
        _reservations = reservations;
        _users = users;
        _qrCodeGenerator = qrCodeGenerator;
        _logger = logger;

        // Stations and slots belong to Component 2. They are read here only to
        // enrich responses and keep slot availability consistent after a transfer.
        _stations = context.Database.GetCollection<SolarStationInfo>("SolarStationInfo");
        _slots = context.Database.GetCollection<EnergyBookingSlot>("EnergyBookingSlot");
    }

    // =========================================================
    // 2. QR CODE GENERATION
    // =========================================================

    /// <inheritdoc />
    public async Task<QrGenerationResponseDto> GenerateQrAsync(
        GenerateQrRequestDto request,
        string requestedByUsername,
        string? requestedByNic,
        bool isStaff)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.ReservationId))
        {
            throw new BadRequestException("RESERVATION_ID_REQUIRED", "A reservation id is required to generate a QR code.");
        }

        var reservationId = request.ReservationId.Trim();

        var reservation = await _reservations.GetByReservationIdAsync(reservationId)
            ?? throw new NotFoundException("RESERVATION_NOT_FOUND", $"No reservation was found for id '{reservationId}'.");

        // A prosumer may only raise a QR against their own booking.
        if (!isStaff && !OwnsReservation(reservation, requestedByNic, requestedByUsername))
        {
            throw new ForbiddenException("RESERVATION_NOT_OWNED", "You can only generate a QR code for your own reservation.");
        }

        if (!reservation.IsApproved)
        {
            // A reservation already closed by an earlier transfer gets its own message.
            if (string.Equals(reservation.Status, ReservationStatus.Completed, StringComparison.OrdinalIgnoreCase))
            {
                throw new ConflictException("TRANSFER_ALREADY_COMPLETED", "This reservation has already been completed.");
            }

            throw new ConflictException(
                "RESERVATION_NOT_APPROVED",
                $"Reservation '{reservationId}' is '{reservation.Status}'. Only approved reservations can be transferred.");
        }

        // A booking whose slot day has passed can no longer be collected.
        if (reservation.SlotDate.Date < DateTime.UtcNow.Date)
        {
            throw new ConflictException("RESERVATION_EXPIRED", "This reservation's slot date has already passed.");
        }

        var existing = await _transactions.GetByReservationIdAsync(reservationId);

        if (existing.Any(t => t.TransferStatus == TransferStatus.Completed))
        {
            throw new ConflictException("TRANSFER_ALREADY_COMPLETED", "Energy for this reservation has already been transferred.");
        }

        // Re-issuing is idempotent: an unused, unexpired token is returned as-is
        // rather than minting a second QR for the same booking.
        var reusable = existing.FirstOrDefault(t =>
            t.QRStatus == QrStatus.Active &&
            t.QRExpiryDate > DateTime.UtcNow &&
            (t.TransferStatus == TransferStatus.Pending || t.TransferStatus == TransferStatus.Verified));

        if (reusable is not null)
        {
            _logger.LogInformation(
                "Returning existing QR for reservation {ReservationId} (transaction {TransactionId}).",
                reservationId, reusable.TransactionId);

            return BuildQrResponse(reusable);
        }

        var transaction = await BuildTransactionAsync(reservation, requestedByUsername);

        await PersistWithUniqueTokenAsync(transaction);

        _logger.LogInformation(
            "Issued transaction {TransactionId} for reservation {ReservationId}.",
            transaction.TransactionId, reservationId);

        return BuildQrResponse(transaction);
    }

    /// <inheritdoc />
    public async Task<QrGenerationResponseDto> GetQrAsync(string transactionId, string? requestedByNic, bool isStaff)
    {
        var transaction = await LoadTransactionAsync(transactionId);

        if (!isStaff && !MatchesNic(transaction.ProsumerNIC, requestedByNic))
        {
            throw new ForbiddenException("TRANSACTION_NOT_OWNED", "You can only view your own transactions.");
        }

        // Surface an expiry that lapsed while the page was closed.
        if (transaction.QRStatus == QrStatus.Active && transaction.QRExpiryDate <= DateTime.UtcNow)
        {
            transaction.QRStatus = QrStatus.Expired;
            await _transactions.UpdateAsync(transaction);
        }

        return BuildQrResponse(transaction);
    }

    // =========================================================
    // 3. QR VERIFICATION
    // =========================================================

    /// <inheritdoc />
    public async Task<QrVerificationResponseDto> VerifyQrAsync(VerifyQrRequestDto request, string operatorUsername)
    {
        // Check 1 — is there a readable token at all?
        var token = _qrCodeGenerator.ExtractToken(request?.QrToken);

        if (string.IsNullOrWhiteSpace(token))
        {
            return Failure("INVALID_QR", "Invalid QR Code");
        }

        var transaction = await _transactions.GetByQrTokenAsync(token);

        // Check 1 (continued) — does the QR exist in our records?
        if (transaction is null)
        {
            _logger.LogWarning("QR verification failed: unknown token presented by operator {Operator}.", operatorUsername);
            return Failure("INVALID_QR", "Invalid QR Code");
        }

        // Check 3 — has this QR already been used?
        if (transaction.TransferStatus == TransferStatus.Completed || transaction.QRStatus == QrStatus.Used)
        {
            return Failure("ALREADY_COMPLETED", "Transaction Already Completed");
        }

        if (transaction.TransferStatus == TransferStatus.Rejected || transaction.QRStatus == QrStatus.Cancelled)
        {
            return Failure("TRANSFER_REJECTED", "This transaction was rejected and its QR is no longer valid.");
        }

        // Check 2 — is the QR past its expiry?
        if (transaction.QRStatus == QrStatus.Expired || transaction.QRExpiryDate <= DateTime.UtcNow)
        {
            if (transaction.QRStatus != QrStatus.Expired)
            {
                transaction.QRStatus = QrStatus.Expired;
                await _transactions.UpdateAsync(transaction);
            }

            return Failure("QR_EXPIRED", "QR Expired");
        }

        // Check 4 — does the related reservation still exist?
        var reservation = await _reservations.GetByReservationIdAsync(transaction.ReservationId);

        if (reservation is null)
        {
            await MarkVerificationFailedAsync(transaction, operatorUsername, "Related reservation no longer exists.");
            return Failure("RESERVATION_NOT_FOUND", "Related reservation not found");
        }

        // Check 5 — is the reservation still approved?
        if (!reservation.IsApproved)
        {
            if (string.Equals(reservation.Status, ReservationStatus.Completed, StringComparison.OrdinalIgnoreCase))
            {
                return Failure("ALREADY_COMPLETED", "Transaction Already Completed");
            }

            await MarkVerificationFailedAsync(transaction, operatorUsername, $"Reservation is '{reservation.Status}'.");
            return Failure("RESERVATION_NOT_APPROVED", $"Reservation is '{reservation.Status}' and cannot be transferred.");
        }

        // All checks passed. Record who verified it, unless a previous scan
        // already did — re-scanning a verified QR is allowed and idempotent.
        if (transaction.TransferStatus == TransferStatus.Pending || transaction.VerificationStatus != VerificationStatus.Verified)
        {
            var gridOperator = await _users.GetByUsernameAsync(operatorUsername);

            transaction.VerificationStatus = VerificationStatus.Verified;
            transaction.TransferStatus = TransferStatus.Verified;
            transaction.OperatorId = operatorUsername;
            transaction.OperatorName = gridOperator?.FullName;
            transaction.VerifiedDate = DateTime.UtcNow;
            transaction.FailureReason = null;

            await _transactions.UpdateAsync(transaction);

            _logger.LogInformation(
                "Transaction {TransactionId} verified by operator {Operator}.",
                transaction.TransactionId, operatorUsername);
        }

        return new QrVerificationResponseDto
        {
            Success = true,
            Message = "QR code verified successfully",
            TransactionDetails = MapToDto(transaction)
        };
    }

    // =========================================================
    // 4. ENERGY TRANSFER COMPLETION
    // =========================================================

    /// <inheritdoc />
    public async Task<OperationResultDto> CompleteTransferAsync(
        string transactionId,
        CompleteTransferRequestDto request,
        string operatorUsername)
    {
        var transaction = await LoadTransactionAsync(transactionId);

        if (transaction.TransferStatus == TransferStatus.Completed)
        {
            throw new ConflictException("ALREADY_COMPLETED", "Transaction Already Completed");
        }

        if (transaction.TransferStatus == TransferStatus.Rejected || transaction.TransferStatus == TransferStatus.Failed)
        {
            throw new ConflictException(
                "TRANSFER_NOT_ACTIVE",
                $"This transaction is '{transaction.TransferStatus}' and can no longer be completed.");
        }

        // The QR must have been scanned first — that scan is what proves the
        // prosumer was physically present at the station.
        if (transaction.TransferStatus != TransferStatus.Verified ||
            transaction.VerificationStatus != VerificationStatus.Verified)
        {
            throw new ConflictException(
                "TRANSFER_NOT_VERIFIED",
                "Scan and verify the QR code before completing this energy transfer.");
        }

        var deliveredEnergy = ResolveDeliveredEnergy(request, transaction);

        var gridOperator = await _users.GetByUsernameAsync(operatorUsername);
        var completedAt = DateTime.UtcNow;

        transaction.EnergyAmount = deliveredEnergy;
        transaction.TransferStatus = TransferStatus.Completed;
        // The token is single-use: consuming it here is what stops a replay.
        transaction.QRStatus = QrStatus.Used;
        transaction.CompletedDate = completedAt;
        transaction.OperatorId = operatorUsername;
        transaction.OperatorName = gridOperator?.FullName ?? transaction.OperatorName;
        transaction.Remarks = string.IsNullOrWhiteSpace(request?.Remarks) ? null : request!.Remarks!.Trim();
        // A successful completion clears any reason left by an earlier failed scan.
        transaction.FailureReason = null;

        await _transactions.UpdateAsync(transaction);

        // Close the reservation so Component 3's screens stop showing it as upcoming.
        var reservationClosed = await _reservations.MarkCompletedAsync(transaction.ReservationId, completedAt);

        if (!reservationClosed)
        {
            // The transfer itself is done and recorded, so this is logged rather
            // than thrown — failing the request here would lose that record.
            _logger.LogWarning(
                "Transaction {TransactionId} completed but reservation {ReservationId} could not be closed.",
                transaction.TransactionId, transaction.ReservationId);
        }

        await SyncSlotAvailabilityAsync(transaction.SlotId);

        _logger.LogInformation(
            "Transaction {TransactionId} completed by operator {Operator} for {Energy} kWh.",
            transaction.TransactionId, operatorUsername, deliveredEnergy);

        return new OperationResultDto
        {
            Message = "Energy transfer completed successfully",
            TransactionId = transaction.TransactionId,
            Timestamp = completedAt,
            Transaction = MapToDto(transaction)
        };
    }

    /// <inheritdoc />
    public async Task<OperationResultDto> RejectTransferAsync(
        string transactionId,
        RejectTransferRequestDto request,
        string operatorUsername)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new BadRequestException("REASON_REQUIRED", "A reason is required when rejecting an energy transfer.");
        }

        var transaction = await LoadTransactionAsync(transactionId);

        if (transaction.TransferStatus == TransferStatus.Completed)
        {
            throw new ConflictException("ALREADY_COMPLETED", "A completed energy transfer cannot be rejected.");
        }

        if (transaction.TransferStatus == TransferStatus.Rejected)
        {
            throw new ConflictException("ALREADY_REJECTED", "This energy transfer has already been rejected.");
        }

        var gridOperator = await _users.GetByUsernameAsync(operatorUsername);

        transaction.TransferStatus = TransferStatus.Rejected;
        transaction.VerificationStatus = VerificationStatus.Failed;
        // Cancelling the token stops the same QR being presented again.
        transaction.QRStatus = QrStatus.Cancelled;
        transaction.FailureReason = request.Reason.Trim();
        transaction.OperatorId = operatorUsername;
        transaction.OperatorName = gridOperator?.FullName ?? transaction.OperatorName;

        await _transactions.UpdateAsync(transaction);

        _logger.LogInformation(
            "Transaction {TransactionId} rejected by operator {Operator}: {Reason}",
            transaction.TransactionId, operatorUsername, transaction.FailureReason);

        return new OperationResultDto
        {
            Message = "Energy transfer rejected",
            TransactionId = transaction.TransactionId,
            Transaction = MapToDto(transaction)
        };
    }

    // =========================================================
    // 5. TRANSACTION HISTORY  &  7. SEARCH AND FILTER
    // =========================================================

    /// <inheritdoc />
    public async Task<TransactionResponseDto> GetTransactionAsync(string transactionId)
    {
        var transaction = await LoadTransactionAsync(transactionId);
        return MapToDto(transaction);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<TransactionResponseDto>> GetHistoryAsync(string prosumerNic, string? status)
    {
        if (string.IsNullOrWhiteSpace(prosumerNic))
        {
            throw new BadRequestException("NIC_REQUIRED", "A prosumer NIC is required to read transfer history.");
        }

        // Reject an unrecognised status rather than silently returning everything.
        var normalizedStatus = NormalizeStatusOrThrow(status);

        var transactions = await _transactions.GetByProsumerAsync(prosumerNic.Trim(), normalizedStatus);

        return transactions.Select(MapToDto).ToList();
    }

    /// <inheritdoc />
    public async Task<PagedResultDto<TransactionResponseDto>> SearchAsync(
        string? status,
        DateTime? date,
        string? stationId,
        string? prosumerNic,
        DateTime? fromDate,
        DateTime? toDate,
        int page,
        int pageSize)
    {
        // Clamp paging so a bad query string cannot pull the whole collection.
        page = page < 1 ? 1 : page;
        pageSize = Math.Clamp(pageSize, 1, 100);

        var normalizedStatus = NormalizeStatusOrThrow(status);

        if (fromDate.HasValue && toDate.HasValue && fromDate.Value.Date > toDate.Value.Date)
        {
            throw new BadRequestException("INVALID_DATE_RANGE", "The from date cannot be later than the to date.");
        }

        var (items, totalCount) = await _transactions.SearchAsync(
            normalizedStatus,
            date,
            string.IsNullOrWhiteSpace(stationId) ? null : stationId.Trim(),
            string.IsNullOrWhiteSpace(prosumerNic) ? null : prosumerNic.Trim(),
            fromDate,
            toDate,
            page,
            pageSize);

        return new PagedResultDto<TransactionResponseDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    // =========================================================
    // 6. DASHBOARD
    // =========================================================

    /// <inheritdoc />
    public async Task<DashboardSummaryDto> GetSummaryAsync(string? prosumerNic)
    {
        // Sweep lapsed tokens first so the counters never show a stale Active QR.
        await ExpireOverdueTokensQuietlyAsync();

        var scope = string.IsNullOrWhiteSpace(prosumerNic) ? null : prosumerNic.Trim();

        var todayStart = DateTime.UtcNow.Date;

        // Independent reads, so they run together rather than one after another.
        var pendingTask = _transactions.CountByStatusAsync(TransferStatus.Pending, scope);
        var verifiedTask = _transactions.CountByStatusAsync(TransferStatus.Verified, scope);
        var completedTask = _transactions.CountByStatusAsync(TransferStatus.Completed, scope);
        var rejectedTask = _transactions.CountByStatusAsync(TransferStatus.Rejected, scope);
        var failedTask = _transactions.CountByStatusAsync(TransferStatus.Failed, scope);
        var todayTask = _transactions.CountCreatedBetweenAsync(todayStart, todayStart.AddDays(1), scope);
        var energyTask = _transactions.SumCompletedEnergyAsync(scope);

        await Task.WhenAll(pendingTask, verifiedTask, completedTask, rejectedTask, failedTask, todayTask, energyTask);

        return new DashboardSummaryDto
        {
            PendingTransfers = pendingTask.Result,
            VerifiedTransfers = verifiedTask.Result,
            CompletedTransfers = completedTask.Result,
            FailedTransfers = rejectedTask.Result + failedTask.Result,
            TodayTransfers = todayTask.Result,
            TotalEnergyTransferred = Math.Round(energyTask.Result, 2),
            Scope = scope ?? "All"
        };
    }

    /// <inheritdoc />
    public async Task<ProsumerDashboardDto> GetProsumerDashboardAsync(string prosumerNic, string? username)
    {
        if (string.IsNullOrWhiteSpace(prosumerNic))
        {
            throw new BadRequestException("NIC_REQUIRED", "A prosumer NIC is required to build the dashboard.");
        }

        var nic = prosumerNic.Trim();

        var summary = await GetSummaryAsync(nic);

        var pendingTask = _transactions.GetRecentByStatusAsync(TransferStatus.Pending, DashboardListSize, nic);
        var verifiedTask = _transactions.GetRecentByStatusAsync(TransferStatus.Verified, DashboardListSize, nic);
        var completedTask = _transactions.GetRecentByStatusAsync(TransferStatus.Completed, DashboardListSize, nic);
        var reservationsTask = _reservations.GetApprovedFromDateAsync(nic, username, DateTime.UtcNow.Date);

        await Task.WhenAll(pendingTask, verifiedTask, completedTask, reservationsTask);

        // Flag bookings that already have a live transaction so the UI can show
        // "View QR" instead of offering to generate a second one.
        var activeReservationIds = pendingTask.Result
            .Concat(verifiedTask.Result)
            .Select(t => t.ReservationId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var upcoming = reservationsTask.Result
            .Select(r => new UpcomingReservationDto
            {
                ReservationId = r.ReservationId,
                StationId = r.StationId,
                SlotId = r.SlotId,
                SlotDate = r.SlotDate,
                SlotTime = FormatSlotTime(r.StartTime, r.EndTime),
                ReservedCapacity = r.ReservedCapacity,
                Status = r.Status,
                HasTransaction = activeReservationIds.Contains(r.ReservationId)
            })
            .ToList();

        await AttachStationNamesAsync(upcoming);

        return new ProsumerDashboardDto
        {
            ProsumerNIC = nic,
            Summary = summary,
            PendingTransactions = pendingTask.Result.Select(MapToDto).ToList(),
            CurrentTransactions = verifiedTask.Result.Select(MapToDto).ToList(),
            CompletedTransactions = completedTask.Result.Select(MapToDto).ToList(),
            ApprovedFutureReservations = upcoming
        };
    }

    /// <inheritdoc />
    public async Task<OperatorDashboardDto> GetOperatorDashboardAsync()
    {
        var summary = await GetSummaryAsync(null);

        var todayTask = _transactions.GetBySlotDateAsync(DateTime.UtcNow.Date, 25);
        var pendingTask = _transactions.GetRecentByStatusAsync(TransferStatus.Pending, DashboardListSize);
        var verifiedTask = _transactions.GetRecentByStatusAsync(TransferStatus.Verified, DashboardListSize);
        var completedTask = _transactions.GetRecentByStatusAsync(TransferStatus.Completed, DashboardListSize);

        await Task.WhenAll(todayTask, pendingTask, verifiedTask, completedTask);

        // Verified transfers are still outstanding work for the operator, so the
        // pending queue shows awaiting-scan and awaiting-confirmation together.
        var outstanding = verifiedTask.Result
            .Concat(pendingTask.Result)
            .OrderByDescending(t => t.TransactionDate)
            .Take(DashboardListSize)
            .Select(MapToDto)
            .ToList();

        return new OperatorDashboardDto
        {
            Summary = summary,
            TodayTransfers = todayTask.Result.Select(MapToDto).ToList(),
            PendingTransfers = outstanding,
            RecentCompleted = completedTask.Result.Select(MapToDto).ToList()
        };
    }

    // =========================================================
    // INTERNAL HELPERS
    // =========================================================

    /// <summary>Loads a transaction or throws a 404 when it does not exist.</summary>
    /// <param name="transactionId">Business key or document id.</param>
    private async Task<EnergyTransaction> LoadTransactionAsync(string transactionId)
    {
        if (string.IsNullOrWhiteSpace(transactionId))
        {
            throw new BadRequestException("TRANSACTION_ID_REQUIRED", "A transaction id is required.");
        }

        return await _transactions.GetByTransactionIdAsync(transactionId.Trim())
            ?? throw new NotFoundException("TRANSACTION_NOT_FOUND", $"No transaction was found for id '{transactionId}'.");
    }

    /// <summary>
    /// Builds a new transaction from an approved reservation, resolving the
    /// prosumer NIC and station name so history stays readable later.
    /// </summary>
    /// <param name="reservation">The approved reservation.</param>
    /// <param name="requestedByUsername">Caller, used to resolve a missing NIC.</param>
    private async Task<EnergyTransaction> BuildTransactionAsync(ReservationSnapshot reservation, string requestedByUsername)
    {
        var prosumerNic = reservation.ProsumerNic;
        var prosumerName = reservation.ProsumerName;

        // Older reservations may carry only a username, so fall back to the user record.
        if (string.IsNullOrWhiteSpace(prosumerNic))
        {
            var owner = await _users.GetByUsernameAsync(reservation.UserId ?? requestedByUsername);

            prosumerNic = owner?.Nic;
            prosumerName ??= owner?.FullName;
        }

        if (string.IsNullOrWhiteSpace(prosumerNic))
        {
            throw new BadRequestException(
                "PROSUMER_NIC_MISSING",
                "This reservation has no prosumer NIC on record, so a transaction cannot be created.");
        }

        var station = await FindStationAsync(reservation.StationId);

        var token = _qrCodeGenerator.GenerateSecureToken();

        return new EnergyTransaction
        {
            TransactionId = BuildTransactionId(),
            ReservationId = reservation.ReservationId,
            ProsumerNIC = prosumerNic,
            ProsumerName = prosumerName,
            StationId = reservation.StationId,
            StationName = station?.StationName,
            SlotId = reservation.SlotId,
            EnergyAmount = reservation.ReservedCapacity,
            SlotDate = reservation.SlotDate.Date,
            StartTime = reservation.StartTime,
            EndTime = reservation.EndTime,
            TransactionDate = DateTime.UtcNow,
            QRToken = token,
            QRStatus = QrStatus.Active,
            QRExpiryDate = CalculateExpiry(reservation),
            VerificationStatus = VerificationStatus.Pending,
            TransferStatus = TransferStatus.Pending
        };
    }

    /// <summary>
    /// Inserts the transaction, minting a fresh token if the unique index rejects
    /// the first attempt. A collision is astronomically unlikely with 160-bit
    /// tokens, but the retry keeps the unique index authoritative.
    /// </summary>
    /// <param name="transaction">The transaction to insert.</param>
    private async Task PersistWithUniqueTokenAsync(EnergyTransaction transaction)
    {
        for (var attempt = 1; attempt <= TokenCollisionRetries; attempt++)
        {
            try
            {
                await _transactions.CreateAsync(transaction);
                return;
            }
            catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
            {
                _logger.LogWarning("Duplicate transaction key on attempt {Attempt}; regenerating identifiers.", attempt);

                transaction.Id = null;
                transaction.TransactionId = BuildTransactionId();
                transaction.QRToken = _qrCodeGenerator.GenerateSecureToken();
            }
        }

        throw new ConflictException("TRANSACTION_CREATE_FAILED", "Could not allocate a unique transaction token. Please try again.");
    }

    /// <summary>
    /// Works out when a token stops being scannable: the end of the booked slot
    /// plus a grace period, and never sooner than a few minutes from now so a
    /// booking made for the current slot is still usable.
    /// </summary>
    /// <param name="reservation">The reservation being issued against.</param>
    private static DateTime CalculateExpiry(ReservationSnapshot reservation)
    {
        var slotEnd = reservation.SlotDate.Date.Add(reservation.EndTime);
        var expiry = slotEnd.Add(ExpiryGrace);
        var floor = DateTime.UtcNow.Add(MinimumTokenLife);

        return expiry < floor ? floor : expiry;
    }

    /// <summary>Generates a readable, sortable transaction business key.</summary>
    private static string BuildTransactionId() =>
        $"TRX-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

    /// <summary>Renders the QR response for a transaction, re-drawing the image from its stored token.</summary>
    /// <param name="transaction">The transaction to render.</param>
    private QrGenerationResponseDto BuildQrResponse(EnergyTransaction transaction)
    {
        var payload = _qrCodeGenerator.BuildPayload(transaction.QRToken);

        return new QrGenerationResponseDto
        {
            TransactionId = transaction.TransactionId,
            QrToken = transaction.QRToken,
            QrPayload = payload,
            QrImageData = _qrCodeGenerator.GenerateQrImageDataUri(payload),
            ExpiryDate = transaction.QRExpiryDate,
            Transaction = MapToDto(transaction)
        };
    }

    /// <summary>Validates the metered amount an operator entered against the reserved amount.</summary>
    /// <param name="request">The completion request.</param>
    /// <param name="transaction">The transaction being completed.</param>
    private static double ResolveDeliveredEnergy(CompleteTransferRequestDto? request, EnergyTransaction transaction)
    {
        if (request?.DeliveredEnergy is null)
        {
            return transaction.EnergyAmount;
        }

        var delivered = request.DeliveredEnergy.Value;

        if (delivered <= 0)
        {
            throw new BadRequestException("INVALID_ENERGY_AMOUNT", "Delivered energy must be greater than zero.");
        }

        // More than the booking would mean drawing capacity nobody reserved.
        if (delivered > transaction.EnergyAmount)
        {
            throw new BadRequestException(
                "ENERGY_EXCEEDS_RESERVATION",
                $"Delivered energy cannot exceed the reserved {transaction.EnergyAmount} kWh.");
        }

        return Math.Round(delivered, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>Records a failed verification attempt against the transaction.</summary>
    /// <param name="transaction">The transaction that failed validation.</param>
    /// <param name="operatorUsername">Operator who attempted the scan.</param>
    /// <param name="reason">Why the scan failed.</param>
    private async Task MarkVerificationFailedAsync(EnergyTransaction transaction, string operatorUsername, string reason)
    {
        transaction.VerificationStatus = VerificationStatus.Failed;
        transaction.TransferStatus = TransferStatus.Failed;
        transaction.OperatorId = operatorUsername;
        transaction.FailureReason = reason;

        await _transactions.UpdateAsync(transaction);

        _logger.LogWarning(
            "Verification failed for transaction {TransactionId} scanned by {Operator}: {Reason}",
            transaction.TransactionId, operatorUsername, reason);
    }

    /// <summary>
    /// Keeps slot availability consistent after a transfer.
    /// <para>
    /// Capacity itself is deliberately left alone: Component 3 already decrements
    /// <c>AvailableCapacity</c> when the reservation is placed, so subtracting
    /// again here would double-count the same energy. What this does do is close
    /// a slot whose capacity is fully consumed, so Component 2's screens stop
    /// advertising it as available.
    /// </para>
    /// </summary>
    /// <param name="slotId">Slot booked by the reservation.</param>
    private async Task SyncSlotAvailabilityAsync(string? slotId)
    {
        if (string.IsNullOrWhiteSpace(slotId))
        {
            return;
        }

        try
        {
            var filter = Builders<EnergyBookingSlot>.Filter.Eq(x => x.SlotId, slotId)
                         & Builders<EnergyBookingSlot>.Filter.Lte(x => x.AvailableCapacity, 0)
                         & Builders<EnergyBookingSlot>.Filter.Eq(x => x.Status, "Available");

            var update = Builders<EnergyBookingSlot>.Update.Set(x => x.Status, "Closed");

            await _slots.UpdateOneAsync(filter, update);
        }
        catch (Exception ex)
        {
            // Slot bookkeeping must never fail a transfer that already happened.
            _logger.LogWarning(ex, "Could not synchronise availability for slot {SlotId}.", slotId);
        }
    }

    /// <summary>Expires lapsed tokens, swallowing any error so dashboards still render.</summary>
    private async Task ExpireOverdueTokensQuietlyAsync()
    {
        try
        {
            var expired = await _transactions.ExpireOverdueTokensAsync(DateTime.UtcNow);

            if (expired > 0)
            {
                _logger.LogInformation("Expired {Count} overdue QR token(s).", expired);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not expire overdue QR tokens.");
        }
    }

    /// <summary>Finds a station by business key or document id.</summary>
    /// <param name="stationId">Station identifier.</param>
    private async Task<SolarStationInfo?> FindStationAsync(string stationId)
    {
        if (string.IsNullOrWhiteSpace(stationId))
        {
            return null;
        }

        try
        {
            var filter = Builders<SolarStationInfo>.Filter.Eq(x => x.StationId, stationId);

            if (MongoDB.Bson.ObjectId.TryParse(stationId, out _))
            {
                filter |= Builders<SolarStationInfo>.Filter.Eq(x => x.Id, stationId);
            }

            return await _stations.Find(filter).FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            // A missing station name only degrades the display, so it is not fatal.
            _logger.LogWarning(ex, "Could not resolve station {StationId}.", stationId);
            return null;
        }
    }

    /// <summary>Fills in station display names for a list of upcoming reservations in one query.</summary>
    /// <param name="reservations">Reservations to enrich in place.</param>
    private async Task AttachStationNamesAsync(List<UpcomingReservationDto> reservations)
    {
        if (reservations.Count == 0)
        {
            return;
        }

        var stationIds = reservations
            .Select(r => r.StationId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();

        if (stationIds.Count == 0)
        {
            return;
        }

        try
        {
            var stations = await _stations
                .Find(Builders<SolarStationInfo>.Filter.In(x => x.StationId, stationIds))
                .ToListAsync();

            var namesById = stations
                .Where(s => !string.IsNullOrWhiteSpace(s.StationId))
                .ToDictionary(s => s.StationId, s => s.StationName, StringComparer.OrdinalIgnoreCase);

            foreach (var reservation in reservations)
            {
                if (namesById.TryGetValue(reservation.StationId, out var name))
                {
                    reservation.StationName = name;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not resolve station names for the prosumer dashboard.");
        }
    }

    /// <summary>Confirms the caller owns the reservation, by NIC or by username.</summary>
    /// <param name="reservation">Reservation being accessed.</param>
    /// <param name="nic">Caller's NIC claim.</param>
    /// <param name="username">Caller's username.</param>
    private static bool OwnsReservation(ReservationSnapshot reservation, string? nic, string username)
    {
        if (MatchesNic(reservation.ProsumerNic, nic))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(reservation.UserId) &&
               string.Equals(reservation.UserId, username, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Compares two NICs case-insensitively, treating a missing value as no match.</summary>
    /// <param name="left">First NIC.</param>
    /// <param name="right">Second NIC.</param>
    private static bool MatchesNic(string? left, string? right) =>
        !string.IsNullOrWhiteSpace(left) &&
        !string.IsNullOrWhiteSpace(right) &&
        string.Equals(left, right, StringComparison.OrdinalIgnoreCase);

    /// <summary>Normalises a status filter, rejecting values outside the known vocabulary.</summary>
    /// <param name="status">Raw status text from the caller.</param>
    private static string? NormalizeStatusOrThrow(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return null;
        }

        return TransferStatus.Normalize(status)
            ?? throw new BadRequestException(
                "INVALID_STATUS",
                $"'{status}' is not a valid transfer status. Valid values: {string.Join(", ", TransferStatus.All)}.");
    }

    /// <summary>Builds a failed verification response.</summary>
    /// <param name="errorCode">Machine readable code.</param>
    /// <param name="message">Message shown on the scanner screen.</param>
    private static QrVerificationResponseDto Failure(string errorCode, string message) => new()
    {
        Success = false,
        ErrorCode = errorCode,
        Message = message
    };

    /// <summary>Renders a slot window as "HH:mm - HH:mm".</summary>
    /// <param name="start">Slot start.</param>
    /// <param name="end">Slot end.</param>
    private static string FormatSlotTime(TimeSpan start, TimeSpan end) =>
        $"{start:hh\\:mm} - {end:hh\\:mm}";

    /// <summary>Projects the stored entity onto the API response shape.</summary>
    /// <param name="transaction">Entity to project.</param>
    private static TransactionResponseDto MapToDto(EnergyTransaction transaction) => new()
    {
        TransactionId = transaction.TransactionId,
        ReservationId = transaction.ReservationId,
        ProsumerNIC = transaction.ProsumerNIC,
        ProsumerName = transaction.ProsumerName,
        StationId = transaction.StationId,
        StationName = transaction.StationName,
        SlotId = transaction.SlotId,
        EnergyAmount = transaction.EnergyAmount,
        SlotDate = transaction.SlotDate,
        SlotTime = FormatSlotTime(transaction.StartTime, transaction.EndTime),
        TransactionDate = transaction.TransactionDate,
        QRStatus = transaction.QRStatus,
        QRExpiryDate = transaction.QRExpiryDate,
        VerificationStatus = transaction.VerificationStatus,
        TransferStatus = transaction.TransferStatus,
        OperatorId = transaction.OperatorId,
        OperatorName = transaction.OperatorName,
        VerifiedDate = transaction.VerifiedDate,
        CompletedDate = transaction.CompletedDate,
        FailureReason = transaction.FailureReason,
        Remarks = transaction.Remarks
    };
}
