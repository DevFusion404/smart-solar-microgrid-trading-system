package com.smartsolar.mobile.ui.fragment

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.EnergySlot
import com.smartsolar.mobile.databinding.ReservationBrowseSlotsBinding
import com.smartsolar.mobile.databinding.ReservationConfirmBookingBinding
import com.smartsolar.mobile.ui.adapter.EnergySlotAdapter
import java.time.LocalDate
import java.util.Locale

class ReserveEnergyFragment : Fragment(R.layout.reservation_browse_slots) {

    private var selectedBookingDate = LocalDate.now()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val binding = ReservationBrowseSlotsBinding.bind(view)

        val slots = buildSampleSlots(LocalDate.now())
        val slotAdapter = EnergySlotAdapter(emptyList(), ::showBookingSheet)

        fun applySlotFilters() {
            val selectedTimeFilter = binding.chipGroupSlotFilters.checkedChipId
            val filteredSlots = slots.filter { slot ->
                val matchesDate = slot.date == selectedBookingDate.toString()
                val matchesTime = when (selectedTimeFilter) {
                    R.id.chipMorningSlots -> slot.startTime.contains("AM", ignoreCase = true)
                    R.id.chipAfternoonSlots -> slot.startTime.contains("PM", ignoreCase = true)
                    else -> true
                }
                matchesDate && matchesTime && slot.status.equals("Available", ignoreCase = true) && slot.availableCapacity > 0
            }

            binding.tvAvailableSlotSummary.text = "${filteredSlots.size} available slots for ${selectedBookingDate.toBrowseDateLabel()}"
            slotAdapter.submitSlots(filteredSlots)
        }

        binding.btnSelectReservationDate.text = selectedBookingDate.toBrowseDateLabel()
        binding.btnSelectReservationDate.setOnClickListener {
            ReservationDatePicker.showUpcoming(this, selectedBookingDate) { date ->
                selectedBookingDate = date
                binding.btnSelectReservationDate.text = date.toBrowseDateLabel()
                applySlotFilters()
            }
        }

        binding.rvAvailableEnergySlots.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = slotAdapter
        }

        binding.chipGroupSlotFilters.setOnCheckedStateChangeListener { _, _ ->
            applySlotFilters()
        }

        applySlotFilters()
    }

    private fun showBookingSheet(slot: EnergySlot) {
        if (!isAdded) return

        val dialog = BottomSheetDialog(requireContext())
        val sheet = ReservationConfirmBookingBinding.inflate(layoutInflater)
        dialog.setContentView(sheet.root)

        sheet.tvBookingSlotSchedule.text = "${selectedBookingDate.toBrowseDateLabel()}, ${slot.startTime} - ${slot.endTime}"
        sheet.tvBookingAvailableCapacity.text = "${slot.availableCapacity.toInt()} kWh"

        sheet.btnDismissBookingSheet.setOnClickListener { dialog.dismiss() }
        sheet.btnConfirmReservation.setOnClickListener {
            val requested = sheet.etReservationCapacity.text?.toString()?.toDoubleOrNull()
            when {
                requested == null || requested <= 0 -> sheet.tilReservationCapacity.error = "Enter the energy amount you need"
                requested > slot.availableCapacity -> sheet.tilReservationCapacity.error = "Only ${slot.availableCapacity.toInt()} kWh is available"
                else -> {
                    sheet.tilReservationCapacity.error = null
                    Toast.makeText(requireContext(), "Reservation request submitted", Toast.LENGTH_SHORT).show()
                    dialog.dismiss()
                }
            }
        }
        dialog.show()
    }
}

private fun buildSampleSlots(firstBookingDate: LocalDate): List<EnergySlot> {
    val capacities = listOf(
        Triple(420.0, 210.0, "09:00 AM"),
        Triple(280.0, 140.0, "10:30 AM"),
        Triple(350.0, 220.0, "01:00 PM"),
    )
    val endTimes = listOf("10:00 AM", "11:30 AM", "02:00 PM")

    return (0..6).flatMap { dayOffset ->
        capacities.mapIndexed { slotOffset, (totalCapacity, availableCapacity, startTime) ->
            EnergySlot(
                slotId = String.format(Locale.US, "SLT-%03d", 18 + (dayOffset * capacities.size) + slotOffset),
                stationId = "Colombo",
                date = firstBookingDate.plusDays(dayOffset.toLong()).toString(),
                startTime = startTime,
                endTime = endTimes[slotOffset],
                totalCapacity = totalCapacity,
                availableCapacity = availableCapacity - (dayOffset * 10),
            )
        }
    }
}

private fun LocalDate.toBrowseDateLabel(): String {
    val formatter = java.time.format.DateTimeFormatter.ofPattern("EEE, dd MMM", Locale.getDefault())
    return when (this) {
        LocalDate.now() -> "Today, ${format(formatter)}"
        LocalDate.now().plusDays(1) -> "Tomorrow, ${format(formatter)}"
        else -> format(formatter)
    }
}
