package com.smartsolar.mobile.ui.fragment

import android.os.Bundle
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.Toast
import android.view.Window
import android.view.WindowManager
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.Reservation
import com.smartsolar.mobile.data.repository.ReservationRepository
import com.smartsolar.mobile.databinding.ReservationDetailsSheetBinding
import com.smartsolar.mobile.databinding.ReservationDeleteConfirmationDialogBinding
import com.smartsolar.mobile.databinding.ReservationEditBookingSheetBinding
import com.smartsolar.mobile.databinding.ReservationMyReservationsBinding
import com.smartsolar.mobile.ui.adapter.MyReservationAdapter
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlinx.coroutines.launch

class MyReservationsFragment : Fragment(R.layout.reservation_my_reservations) {

    companion object {
        private const val RESERVATION_CHANGE_WINDOW_HOURS = 12L
    }

    private var _binding: ReservationMyReservationsBinding? = null
    private val binding get() = _binding!!

    private var selectedReservationDate = LocalDate.now()
    private var selectedStatusId = R.id.chipReservationAll
    private lateinit var reservationAdapter: MyReservationAdapter
    private lateinit var reservationRepository: ReservationRepository
    private var isLoadingReservations = false
    private var reservationLoadMessage: String? = null

    private val reservations = mutableListOf<ReservationUi>()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = ReservationMyReservationsBinding.bind(view)
        reservationRepository = ReservationRepository()

        reservationAdapter = MyReservationAdapter(reservations, ::showReservationDetails)
        binding.rvMyReservations.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = reservationAdapter
        }

        binding.btnReservationDate.text = selectedReservationDate.toMyReservationDateLabel()
        binding.btnReservationDate.setOnClickListener {
            ReservationDatePicker.showUpcoming(this, selectedReservationDate) { date ->
                selectedReservationDate = date
                binding.btnReservationDate.text = date.toMyReservationDateLabel()
                loadReservations()
            }
        }

        binding.chipGroupReservationStatus.setOnCheckedStateChangeListener { _, checkedIds ->
            selectedStatusId = checkedIds.firstOrNull() ?: R.id.chipReservationAll
            applyFilters()
        }

        loadReservations()
    }

    private fun loadReservations() {
        isLoadingReservations = true
        reservationLoadMessage = null
        applyFilters()

        viewLifecycleOwner.lifecycleScope.launch {
            reservationRepository.getAllReservations().fold(
                onSuccess = { apiReservations ->
                    reservations.clear()
                    reservations += apiReservations.map { it.toReservationUi() }
                },
                onFailure = { error ->
                    reservations.clear()
                    reservationLoadMessage = error.message ?: "Unable to load your reservations."
                },
            )
            isLoadingReservations = false
            applyFilters()
        }
    }

    private fun applyFilters() {
        val filteredReservations = reservations.filter { reservation ->
            val matchesDate = reservation.reservationDate == selectedReservationDate
            val matchesStatus = when (selectedStatusId) {
                R.id.chipReservationPending -> reservation.status.equals("Pending", ignoreCase = true)
                R.id.chipReservationConfirmed -> reservation.status.equals("Confirmed", ignoreCase = true)
                else -> true
            }
            matchesDate && matchesStatus
        }
        reservationAdapter.submitReservations(filteredReservations)
        binding.pbMyReservations.visibility = if (isLoadingReservations) View.VISIBLE else View.GONE
        binding.rvMyReservations.visibility =
            if (isLoadingReservations || filteredReservations.isEmpty()) View.INVISIBLE else View.VISIBLE
        binding.tvMyReservationsMessage.visibility =
            if (!isLoadingReservations && filteredReservations.isEmpty()) View.VISIBLE else View.GONE
        if (!isLoadingReservations && filteredReservations.isEmpty()) {
            binding.tvMyReservationsMessage.text = reservationLoadMessage
                ?: "No upcoming reservations found for ${selectedReservationDate.toMyReservationDateLabel()}."
        }
        updateReservationSummary()
    }

    private fun updateReservationSummary() {
        val activeReservations = reservations.filter { reservation ->
            reservation.reservationDate == selectedReservationDate &&
                !reservation.status.equals("Cancelled", ignoreCase = true) &&
                !reservation.status.equals("Completed", ignoreCase = true)
        }
        binding.tvActiveReservationCount.text = activeReservations.size.toString()
        binding.tvReservedEnergyTotal.text = "${activeReservations.sumOf { it.energyKwh() }.toEnergyLabel()} kWh"
    }

    private fun showReservationDetails(reservation: ReservationUi) {
        if (!isAdded) return

        val dialog = BottomSheetDialog(requireContext())
        val sheet = ReservationDetailsSheetBinding.inflate(layoutInflater)
        dialog.setContentView(sheet.root)

        sheet.tvDetailReservationId.text = reservation.id
        sheet.tvDetailReservationStatus.text = reservation.status
        sheet.tvDetailStation.text = reservation.station
        sheet.tvDetailSlot.text = "${reservation.date}, ${reservation.time}"
        sheet.tvDetailReservedEnergy.text = reservation.energy
        sheet.tvDetailCreatedAt.text = reservation.createdAt

        val changesAllowed = canChangeReservation(reservation)
        sheet.tvReservationChangeWindow.text = reservation.changeWindowMessage()
        sheet.btnEditReservation.isEnabled = changesAllowed
        sheet.btnDeleteReservation.isEnabled = changesAllowed
        sheet.btnEditReservation.alpha = if (changesAllowed) 1f else 0.45f
        sheet.btnDeleteReservation.alpha = if (changesAllowed) 1f else 0.45f

        if (changesAllowed) {
            sheet.btnEditReservation.setOnClickListener {
                dialog.dismiss()
                showEditReservationSheet(reservation)
            }
            sheet.btnDeleteReservation.setOnClickListener {
                showDeleteConfirmation(reservation, dialog)
            }
        }

        dialog.expandForReservationActions()
        dialog.show()
    }

    private fun showEditReservationSheet(reservation: ReservationUi) {
        if (!isAdded) return

        val dialog = BottomSheetDialog(requireContext())
        val sheet = ReservationEditBookingSheetBinding.inflate(layoutInflater)
        dialog.setContentView(sheet.root)

        sheet.tvUpdateReservationStation.text = reservation.station
        sheet.tvUpdateReservationSchedule.text = "${reservation.date}, ${reservation.time}"
        sheet.etUpdatedReservationCapacity.setText(reservation.energyKwh().toEnergyLabel())
        sheet.tvUpdateReservationWindow.text = reservation.changeWindowMessage()

        sheet.btnDismissReservationUpdate.setOnClickListener { dialog.dismiss() }
        sheet.btnSaveReservationUpdate.setOnClickListener {
            val updatedCapacity = sheet.etUpdatedReservationCapacity.text?.toString()?.toDoubleOrNull()
            when {
                updatedCapacity == null || updatedCapacity <= 0 -> {
                    sheet.tilUpdatedReservationCapacity.error = "Enter a valid energy amount"
                }
                !canChangeReservation(reservation) -> {
                    sheet.tilUpdatedReservationCapacity.error = "The 12-hour change period has ended"
                }
                else -> {
                    sheet.tilUpdatedReservationCapacity.error = null
                    sheet.btnSaveReservationUpdate.isEnabled = false
                    viewLifecycleOwner.lifecycleScope.launch {
                        reservationRepository.updateReservation(reservation.id, updatedCapacity).fold(
                            onSuccess = { updated ->
                                val index = reservations.indexOfFirst { it.id == reservation.id }
                                if (index >= 0) {
                                    reservations[index] = updated.toReservationUi()
                                    applyFilters()
                                }
                                Toast.makeText(requireContext(), "Reservation updated", Toast.LENGTH_SHORT).show()
                                dialog.dismiss()
                            },
                            onFailure = { error ->
                                sheet.btnSaveReservationUpdate.isEnabled = true
                                sheet.tilUpdatedReservationCapacity.error =
                                    error.message ?: "Could not update reservation"
                            }
                        )
                    }
                }
            }
        }
        dialog.expandForReservationActions()
        dialog.show()
    }

    private fun showDeleteConfirmation(reservation: ReservationUi, detailsDialog: BottomSheetDialog) {
        if (!isAdded) return

        val dialog = android.app.Dialog(requireContext())
        val confirmation = ReservationDeleteConfirmationDialogBinding.inflate(layoutInflater)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setContentView(confirmation.root)
        dialog.setCanceledOnTouchOutside(false)
        val dialogWidth = (resources.displayMetrics.widthPixels * 0.86f).toInt()
        dialog.window?.apply {
            setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            attributes = attributes.apply {
                width = dialogWidth
                height = WindowManager.LayoutParams.WRAP_CONTENT
                gravity = Gravity.CENTER
                dimAmount = 0.72f
            }
            addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            setWindowAnimations(0)
        }

        confirmation.tvDeleteReservationId.text = reservation.id
        confirmation.btnKeepReservation.setOnClickListener { dialog.dismiss() }
        confirmation.btnConfirmDeleteReservation.setOnClickListener {
                if (!canChangeReservation(reservation)) {
                    Toast.makeText(requireContext(), "The 12-hour change period has ended", Toast.LENGTH_SHORT).show()
                    dialog.dismiss()
                    return@setOnClickListener
                }

                confirmation.btnConfirmDeleteReservation.isEnabled = false
                viewLifecycleOwner.lifecycleScope.launch {
                    reservationRepository.deleteReservation(reservation.id).fold(
                        onSuccess = {
                            reservations.removeAll { it.id == reservation.id }
                            applyFilters()
                            detailsDialog.dismiss()
                            dialog.dismiss()
                            Toast.makeText(requireContext(), "Reservation deleted", Toast.LENGTH_SHORT).show()
                        },
                        onFailure = { error ->
                            confirmation.btnConfirmDeleteReservation.isEnabled = true
                            Toast.makeText(
                                requireContext(),
                                error.message ?: "Could not delete reservation",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    )
                }
            }

        dialog.show()
    }

    private fun canChangeReservation(reservation: ReservationUi): Boolean {
        val requestTime = reservation.requestedAt ?: return false
        val editableStatus = reservation.status.equals("Pending", true) || reservation.status.equals("Confirmed", true)
        return editableStatus && LocalDateTime.now().isBefore(requestTime.plusHours(RESERVATION_CHANGE_WINDOW_HOURS))
    }

    private fun ReservationUi.changeWindowMessage(): String {
        val requestTime = requestedAt ?: return "This reservation cannot be changed."
        val remaining = Duration.between(LocalDateTime.now(), requestTime.plusHours(RESERVATION_CHANGE_WINDOW_HOURS))
        if (!canChangeReservation(this) || remaining.isNegative || remaining.isZero) {
            return "The 12-hour update and delete period has ended for this reservation."
        }

        val hours = remaining.toHours()
        val minutes = remaining.minusHours(hours).toMinutes()
        return "You can update or delete this reservation for ${hours}h ${minutes}m after your request."
    }

    private fun ReservationUi.energyKwh(): Double = energy.substringBefore(" ").replace(",", "").toDoubleOrNull() ?: 0.0

    private fun Double.toEnergyLabel(): String =
        if (this % 1.0 == 0.0) toInt().toString() else String.format(Locale.getDefault(), "%.1f", this)

    private fun Reservation.toReservationUi(): ReservationUi {
        val bookingDate = slotDate.toLocalDateOrNull()
        val requestedAt = createdAt.toLocalDateTimeOrNull()
        return ReservationUi(
            id = reservationId,
            station = stationName.ifBlank { stationId },
            date = bookingDate?.toReservationDateLabel() ?: slotDate,
            time = "${startTime.toReservationTimeLabel()} - ${endTime.toReservationTimeLabel()}",
            energy = "${reservedCapacity.toEnergyLabel()} kWh",
            status = status,
            createdAt = requestedAt?.toRequestedLabel() ?: createdAt,
            reservationDate = bookingDate,
            requestedAt = requestedAt,
        )
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

private fun BottomSheetDialog.expandForReservationActions() {
    setOnShowListener {
        findViewById<FrameLayout>(com.google.android.material.R.id.design_bottom_sheet)?.let { bottomSheet ->
            BottomSheetBehavior.from(bottomSheet).apply {
                skipCollapsed = true
                state = BottomSheetBehavior.STATE_EXPANDED
            }
        }
    }
}

private fun LocalDateTime.toRequestedLabel(): String =
    format(DateTimeFormatter.ofPattern("dd MMM, h:mm a", Locale.getDefault()))

private fun String.toLocalDateOrNull(): LocalDate? =
    runCatching { Instant.parse(this).atZone(ZoneId.systemDefault()).toLocalDate() }.getOrNull()
        ?: runCatching { LocalDate.parse(take(10)) }.getOrNull()

private fun String.toLocalDateTimeOrNull(): LocalDateTime? =
    runCatching { Instant.parse(this).atZone(ZoneId.systemDefault()).toLocalDateTime() }.getOrNull()
        ?: runCatching { LocalDateTime.parse(this) }.getOrNull()

private fun String.toReservationTimeLabel(): String =
    runCatching {
        LocalTime.parse(this).format(DateTimeFormatter.ofPattern("hh:mm a", Locale.getDefault()))
    }.getOrDefault(this)

private fun LocalDate.toReservationDateLabel(): String =
    when (this) {
        LocalDate.now() -> "Today"
        LocalDate.now().plusDays(1) -> "Tomorrow"
        else -> format(DateTimeFormatter.ofPattern("dd MMM", Locale.getDefault()))
    }

private fun LocalDate.toMyReservationDateLabel(): String {
    val formatter = DateTimeFormatter.ofPattern("EEE, dd MMM", Locale.getDefault())
    return when (this) {
        LocalDate.now() -> "Today, ${format(formatter)}"
        LocalDate.now().plusDays(1) -> "Tomorrow, ${format(formatter)}"
        else -> format(formatter)
    }
}
