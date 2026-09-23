/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : TransactionStatus.cs
Description   : Status vocabularies used by the energy transfer
                workflow. Declared as string constants (not enums)
                so the values persist to MongoDB exactly as the
                reservation and slot collections already store
                their own statuses.
Author        : Malmi
=====================================================
*/

namespace backend.Models;

/// <summary>
/// Lifecycle of the energy transfer itself.
/// A transaction moves Pending -> Verified -> Completed on the happy path,
/// and may end as Rejected (operator refused) or Failed (verification broke down).
/// </summary>
public static class TransferStatus
{
    /// <summary>QR issued, waiting for the grid operator to scan it.</summary>
    public const string Pending = "Pending";

    /// <summary>QR scanned and validated; the operator may now confirm the transfer.</summary>
    public const string Verified = "Verified";

    /// <summary>Energy handed over and the reservation closed.</summary>
    public const string Completed = "Completed";

    /// <summary>Verification or transfer could not be carried out.</summary>
    public const string Failed = "Failed";

    /// <summary>Operator declined the transfer at the station.</summary>
    public const string Rejected = "Rejected";

    /// <summary>Every status this component recognises — used to validate filter input.</summary>
    public static readonly string[] All =
    {
        Pending, Verified, Completed, Failed, Rejected
    };

    /// <summary>
    /// Resolves user supplied text (query string, mobile app) to a canonical
    /// status value, ignoring case. Returns null when nothing matches.
    /// </summary>
    public static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return All.FirstOrDefault(s => string.Equals(s, value.Trim(), StringComparison.OrdinalIgnoreCase));
    }
}

/// <summary>
/// Lifecycle of the QR token attached to a transaction.
/// A token is single-use: once the transfer completes it becomes Used and
/// can never verify again.
/// </summary>
public static class QrStatus
{
    /// <summary>Token is live and can still be scanned.</summary>
    public const string Active = "Active";

    /// <summary>Token has been consumed by a completed transfer.</summary>
    public const string Used = "Used";

    /// <summary>Token passed its expiry date without being completed.</summary>
    public const string Expired = "Expired";

    /// <summary>Token was invalidated because the operator rejected the transfer.</summary>
    public const string Cancelled = "Cancelled";
}

/// <summary>
/// Outcome of the grid operator's QR verification step, kept separate from
/// <see cref="TransferStatus"/> so the audit trail shows *who* validated the
/// token even if the transfer itself later fails.
/// </summary>
public static class VerificationStatus
{
    /// <summary>Nobody has scanned the token yet.</summary>
    public const string Pending = "Pending";

    /// <summary>A grid operator scanned the token and all checks passed.</summary>
    public const string Verified = "Verified";

    /// <summary>A scan was attempted but the token or reservation failed validation.</summary>
    public const string Failed = "Failed";
}

/// <summary>
/// Reservation statuses this component reads from Component 3's collection.
/// Component 3 writes "Confirmed"; the assignment brief calls the same state
/// "Approved", so both are accepted as transfer-eligible.
/// </summary>
public static class ReservationStatus
{
    /// <summary>Booking is confirmed and eligible for energy transfer.</summary>
    public static readonly string[] Approved = { "Confirmed", "Approved", "Active" };

    /// <summary>Written back by this component once the energy has been handed over.</summary>
    public const string Completed = "Completed";

    /// <summary>Booking was withdrawn; no transfer may take place.</summary>
    public const string Cancelled = "Cancelled";

    /// <summary>True when the given reservation status permits an energy transfer.</summary>
    public static bool IsApproved(string? status) =>
        !string.IsNullOrWhiteSpace(status) &&
        Approved.Any(s => string.Equals(s, status, StringComparison.OrdinalIgnoreCase));
}
