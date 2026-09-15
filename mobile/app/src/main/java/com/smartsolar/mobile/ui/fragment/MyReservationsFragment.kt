package com.smartsolar.mobile.ui.fragment

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.smartsolar.mobile.R
import com.smartsolar.mobile.databinding.ReservationDetailsSheetBinding
import com.smartsolar.mobile.databinding.ReservationMyReservationsBinding
import com.smartsolar.mobile.ui.adapter.MyReservationAdapter
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

class MyReservationsFragment : Fragment(R.layout.reservation_my_reservations) {

    private var selectedReservationDate = LocalDate.now()
    private var selectedStatusId = R.id.chipReservationAll

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val binding = ReservationMyReservationsBinding.bind(view)

        val reservations = listOf(
            ReservationUi("RES-2048", "Colombo Solar Hub", "Today", "09:00 - 10:00", "420 kWh", "Pending", "Today, 8:42 AM"),
            ReservationUi("RES-2047", "Kandy Energy Station", "Today", "10:30 - 11:30", "280 kWh", "Confirmed", "Yesterday, 4:18 PM"),
            ReservationUi("RES-2045", "Galle Solar Hub", "Tomorrow", "01:00 - 02:00", "350 kWh", "Confirmed", "Yesterday, 2:06 PM"),
        )
        val reservationDates = mapOf(
            "RES-2048" to LocalDate.now(),
            "RES-2047" to LocalDate.now(),
            "RES-2045" to LocalDate.now().plusDays(1),
        )
        val reservationAdapter = MyReservationAdapter(reservations, ::showReservationDetails)

        fun applyFilters() {
            val filteredReservations = reservations.filter { reservation ->
                val matchesDate = reservationDates[reservation.id] == selectedReservationDate
                val matchesStatus = when (selectedStatusId) {
                    R.id.chipReservationPending -> reservation.status.equals("Pending", ignoreCase = true)
                    R.id.chipReservationConfirmed -> reservation.status.equals("Confirmed", ignoreCase = true)
                    else -> true
                }
                matchesDate && matchesStatus
            }
            reservationAdapter.submitReservations(filteredReservations)
        }

        binding.btnReservationDate.text = selectedReservationDate.toMyReservationDateLabel()
        binding.btnReservationDate.setOnClickListener {
            ReservationDatePicker.showUpcoming(this, selectedReservationDate) { date ->
                selectedReservationDate = date
                binding.btnReservationDate.text = date.toMyReservationDateLabel()
                applyFilters()
            }
        }

        binding.rvMyReservations.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = reservationAdapter
        }

        binding.chipGroupReservationStatus.setOnCheckedStateChangeListener { _, checkedIds ->
            selectedStatusId = checkedIds.firstOrNull() ?: R.id.chipReservationAll
            applyFilters()
        }
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

        sheet.btnCancelReservation.setOnClickListener {
            Toast.makeText(requireContext(), "Reservation cancellation requested", Toast.LENGTH_SHORT).show()
            dialog.dismiss()
        }
        dialog.show()
    }
}

private fun LocalDate.toMyReservationDateLabel(): String {
    val formatter = DateTimeFormatter.ofPattern("EEE, dd MMM", Locale.getDefault())
    return when (this) {
        LocalDate.now() -> "Today, ${format(formatter)}"
        LocalDate.now().plusDays(1) -> "Tomorrow, ${format(formatter)}"
        else -> format(formatter)
    }
}
