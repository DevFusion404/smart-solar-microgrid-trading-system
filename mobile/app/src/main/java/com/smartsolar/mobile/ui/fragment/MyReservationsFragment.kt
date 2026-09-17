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
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.smartsolar.mobile.R
import com.smartsolar.mobile.databinding.ReservationDetailsSheetBinding
import com.smartsolar.mobile.databinding.ReservationDeleteConfirmationDialogBinding
import com.smartsolar.mobile.databinding.ReservationEditBookingSheetBinding
import com.smartsolar.mobile.databinding.ReservationMyReservationsBinding
import com.smartsolar.mobile.ui.adapter.MyReservationAdapter
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

class MyReservationsFragment : Fragment(R.layout.reservation_my_reservations) {

    companion object {
        private const val RESERVATION_CHANGE_WINDOW_HOURS = 12L
    }

    private var _binding: ReservationMyReservationsBinding? = null
    private val binding get() = _binding!!

    private var selectedReservationDate = LocalDate.now()
    private var selectedStatusId = R.id.chipReservationAll
    private lateinit var reservationAdapter: MyReservationAdapter

    // UI-only sample data. Replace with API results when reservation endpoints are connected.
    private val reservations = mutableListOf<ReservationUi>()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = ReservationMyReservationsBinding.bind(view)
        seedReservations()

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
                applyFilters()
            }
        }

        binding.chipGroupReservationStatus.setOnCheckedStateChangeListener { _, checkedIds ->
            selectedStatusId = checkedIds.firstOrNull() ?: R.id.chipReservationAll
            applyFilters()
        }

        applyFilters()
    }

    private fun seedReservations() {
        if (reservations.isNotEmpty()) return

        val now = LocalDateTime.now()
        reservations += listOf(
            ReservationUi(
                id = "RES-2048",
                station = "Colombo Solar Hub",
                date = "Today",
                time = "09:00 - 10:00",
                energy = "420 kWh",
                status = "Pending",
                createdAt = now.minusHours(2).toRequestedLabel(),
                reservationDate = LocalDate.now(),
                requestedAt = now.minusHours(2),
            ),
            ReservationUi(
                id = "RES-2047",
                station = "Kandy Energy Station",
                date = "Today",
                time = "10:30 - 11:30",
                energy = "280 kWh",
                status = "Confirmed",
                createdAt = now.minusHours(13).toRequestedLabel(),
                reservationDate = LocalDate.now(),
                requestedAt = now.minusHours(13),
            ),
            ReservationUi(
                id = "RES-2045",
                station = "Galle Solar Hub",
                date = "Tomorrow",
                time = "01:00 - 02:00",
                energy = "350 kWh",
                status = "Confirmed",
                createdAt = now.minusHours(5).toRequestedLabel(),
                reservationDate = LocalDate.now().plusDays(1),
                requestedAt = now.minusHours(5),
            ),
        )
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
        updateReservationSummary()
    }

    private fun updateReservationSummary() {
        val activeReservations = reservations.filter { it.status != "Cancelled" && it.status != "Completed" }
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
                    val index = reservations.indexOfFirst { it.id == reservation.id }
                    if (index >= 0) {
                        reservations[index] = reservation.copy(energy = "${updatedCapacity.toEnergyLabel()} kWh")
                        applyFilters()
                    }
                    Toast.makeText(requireContext(), "Reservation updated", Toast.LENGTH_SHORT).show()
                    dialog.dismiss()
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

                reservations.removeAll { it.id == reservation.id }
                applyFilters()
                detailsDialog.dismiss()
                dialog.dismiss()
                Toast.makeText(requireContext(), "Reservation deleted", Toast.LENGTH_SHORT).show()
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

private fun LocalDate.toMyReservationDateLabel(): String {
    val formatter = DateTimeFormatter.ofPattern("EEE, dd MMM", Locale.getDefault())
    return when (this) {
        LocalDate.now() -> "Today, ${format(formatter)}"
        LocalDate.now().plusDays(1) -> "Tomorrow, ${format(formatter)}"
        else -> format(formatter)
    }
}
