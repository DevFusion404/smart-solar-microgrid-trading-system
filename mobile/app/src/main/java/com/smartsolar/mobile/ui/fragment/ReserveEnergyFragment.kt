package com.smartsolar.mobile.ui.fragment

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.EnergySlot
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.data.repository.SlotRepository
import com.smartsolar.mobile.data.repository.StationRepository
import com.smartsolar.mobile.data.repository.ReservationRepository
import com.smartsolar.mobile.databinding.ReservationBrowseSlotsBinding
import com.smartsolar.mobile.databinding.ReservationConfirmBookingBinding
import com.smartsolar.mobile.ui.adapter.EnergySlotAdapter
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.util.Locale

class ReserveEnergyFragment : Fragment(R.layout.reservation_browse_slots) {

    companion object {
        private const val ARG_STATION_ID = "arg_station_id"
        private const val ARG_STATION_NAME = "arg_station_name"
        private const val ARG_STATION_ADDRESS = "arg_station_address"

        fun newInstance(stationId: String, stationName: String, stationAddress: String): ReserveEnergyFragment {
            return ReserveEnergyFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_STATION_ID, stationId)
                    putString(ARG_STATION_NAME, stationName)
                    putString(ARG_STATION_ADDRESS, stationAddress)
                }
            }
        }
    }

    private var _binding: ReservationBrowseSlotsBinding? = null
    private val binding get() = _binding!!

    private lateinit var slotRepository: SlotRepository
    private lateinit var stationRepository: StationRepository
    private lateinit var reservationRepository: ReservationRepository
    private lateinit var slotAdapter: EnergySlotAdapter

    private var selectedStationId: String = ""
    private var selectedStationName: String = ""
    private var selectedStationAddress: String = ""

    private var selectedBookingDate: LocalDate = LocalDate.now()
    private var allFetchedSlots: List<EnergySlot> = emptyList()
    private var availableStations: List<Station> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        selectedStationId = arguments?.getString(ARG_STATION_ID) ?: ""
        selectedStationName = arguments?.getString(ARG_STATION_NAME) ?: ""
        selectedStationAddress = arguments?.getString(ARG_STATION_ADDRESS) ?: ""
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = ReservationBrowseSlotsBinding.bind(view)

        slotRepository = SlotRepository(requireContext())
        stationRepository = StationRepository(requireContext())
        reservationRepository = ReservationRepository()

        setupRecyclerView()
        setupDateSelector()
        setupStationSelector()
        setupFilterChips()

        initializeData()
    }

    private fun setupRecyclerView() {
        slotAdapter = EnergySlotAdapter(emptyList(), ::showBookingSheet)
        binding.rvAvailableEnergySlots.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = slotAdapter
        }
    }

    private fun setupDateSelector() {
        binding.btnSelectReservationDate.text = selectedBookingDate.toBrowseDateLabel()
        binding.btnSelectReservationDate.setOnClickListener {
            ReservationDatePicker.showUpcoming(this, selectedBookingDate) { date ->
                selectedBookingDate = date
                binding.btnSelectReservationDate.text = date.toBrowseDateLabel()
                loadSlots()
            }
        }
    }

    private fun setupStationSelector() {
        binding.btnChangeStation.setOnClickListener {
            showStationPickerDialog()
        }
    }

    private fun setupFilterChips() {
        binding.chipGroupSlotFilters.setOnCheckedStateChangeListener { _, _ ->
            applySlotFilters()
        }
    }

    private fun initializeData() {
        binding.pbSlotsLoading.visibility = View.VISIBLE
        binding.layoutEmptySlots.visibility = View.GONE

        lifecycleScope.launch {
            // Reservation availability must use the live station list, not a potentially stale cache.
            val stationsResult = stationRepository.getStations(forceRefresh = true)
            if (stationsResult.isSuccess) {
                availableStations = (stationsResult.getOrNull() ?: emptyList())
                    .filter { it.status.equals("Active", ignoreCase = true) }

                // If a station was not passed via arguments, select the first live active station.
                if (selectedStationId.isBlank() && availableStations.isNotEmpty()) {
                    val defaultStation = availableStations.first()
                    selectedStationId = defaultStation.stationId.ifBlank { defaultStation.id ?: "" }
                    selectedStationName = defaultStation.stationName
                    selectedStationAddress = defaultStation.address
                }

                if (selectedStationId.isNotBlank()) {
                    updateStationBanner()
                    loadSlots()
                } else {
                    binding.pbSlotsLoading.visibility = View.GONE
                    binding.layoutEmptySlots.visibility = View.VISIBLE
                    binding.tvEmptySlotsReason.text = "No active microgrid stations are available right now."
                }
            } else {
                binding.pbSlotsLoading.visibility = View.GONE
                binding.layoutEmptySlots.visibility = View.VISIBLE
                binding.tvEmptySlotsReason.text = "Could not load microgrid stations. Check the backend connection and try again."
            }
        }
    }

    private fun updateStationBanner() {
        binding.tvSelectedStationName.text = selectedStationName.ifBlank { "Microgrid Node: $selectedStationId" }
        binding.tvSelectedStationAddress.text = selectedStationAddress.ifBlank { "Station ID: $selectedStationId" }
    }

    private fun showStationPickerDialog() {
        if (availableStations.isEmpty()) {
            Toast.makeText(requireContext(), "No stations available to select", Toast.LENGTH_SHORT).show()
            return
        }

        val stationNames = availableStations.map { station ->
            "${station.stationName} (${station.stationId.ifBlank { station.id?.takeLast(6) }})"
        }.toTypedArray()

        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Select Microgrid Station")
            .setItems(stationNames) { _, which ->
                val selected = availableStations[which]
                selectedStationId = selected.stationId.ifBlank { selected.id ?: "" }
                selectedStationName = selected.stationName
                selectedStationAddress = selected.address
                updateStationBanner()
                loadSlots()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun loadSlots() {
        if (selectedStationId.isBlank()) {
            binding.layoutEmptySlots.visibility = View.VISIBLE
            binding.tvEmptySlotsReason.text = "Please select a microgrid station to view slots."
            return
        }

        binding.pbSlotsLoading.visibility = View.VISIBLE
        binding.layoutEmptySlots.visibility = View.GONE
        binding.rvAvailableEnergySlots.visibility = View.GONE

        lifecycleScope.launch {
            // The selected date is part of availability. Never show slots from another day.
            val result = slotRepository.getSlotsByStation(
                selectedStationId,
                selectedBookingDate.toString()
            )
            binding.pbSlotsLoading.visibility = View.GONE

            if (result.isSuccess) {
                allFetchedSlots = result.getOrNull() ?: emptyList()
                applySlotFilters()
            } else {
                allFetchedSlots = emptyList()
                applySlotFilters()
                val err = result.exceptionOrNull()?.message ?: "Could not load slots"
                Toast.makeText(requireContext(), err, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun applySlotFilters() {
        val selectedTimeFilter = binding.chipGroupSlotFilters.checkedChipId

        val matchingSlots = allFetchedSlots.filter { slot ->
            val slotDate = parseSlotLocalDate(slot.date)
            val matchesDate = slotDate == selectedBookingDate

            val matchesTime = when (selectedTimeFilter) {
                R.id.chipMorningSlots -> isMorning(slot.startTime)
                R.id.chipAfternoonSlots -> isAfternoon(slot.startTime)
                else -> true
            }

            val isAvailable = slot.status.equals("Available", ignoreCase = true) && slot.availableCapacity > 0
            matchesDate && matchesTime && isAvailable
        }

        binding.tvAvailableSlotSummary.text =
            "${matchingSlots.size} available slots for ${selectedBookingDate.toBrowseDateLabel()}"

        slotAdapter.submitSlots(matchingSlots)

        val isEmpty = matchingSlots.isEmpty()
        binding.layoutEmptySlots.visibility = if (isEmpty) View.VISIBLE else View.GONE
        binding.rvAvailableEnergySlots.visibility = if (isEmpty) View.GONE else View.VISIBLE
        if (isEmpty) {
            binding.tvEmptySlotsReason.text = when {
                allFetchedSlots.isEmpty() ->
                    "$selectedStationName is active, but no energy slots are scheduled for ${selectedBookingDate.toBrowseDateLabel()}."
                allFetchedSlots.none {
                    it.status.equals("Available", ignoreCase = true) && it.availableCapacity > 0
                } ->
                    "Slots exist for this date, but they are closed or have no remaining capacity."
                else ->
                    "No slots match the selected time filter. Try All slots."
            }
        }
    }

    private fun parseSlotLocalDate(dateStr: String): LocalDate? {
        if (dateStr.isBlank()) return null
        return try {
            java.time.Instant.parse(dateStr)
                .atZone(java.time.ZoneId.systemDefault())
                .toLocalDate()
        } catch (e: Exception) {
            try {
                LocalDate.parse(dateStr.take(10))
            } catch (e2: Exception) {
                null
            }
        }
    }

    private fun isMorning(timeStr: String): Boolean {
        val clean = timeStr.trim()
        if (clean.contains("AM", ignoreCase = true)) return true
        if (clean.contains("PM", ignoreCase = true)) return false
        val hour = clean.split(":").firstOrNull()?.toIntOrNull() ?: 8
        return hour < 12
    }

    private fun isAfternoon(timeStr: String): Boolean {
        val clean = timeStr.trim()
        if (clean.contains("PM", ignoreCase = true)) return true
        if (clean.contains("AM", ignoreCase = true)) return false
        val hour = clean.split(":").firstOrNull()?.toIntOrNull() ?: 14
        return hour >= 12
    }

    private fun showBookingSheet(slot: EnergySlot) {
        if (!isAdded) return

        val dialog = BottomSheetDialog(requireContext())
        val sheet = ReservationConfirmBookingBinding.inflate(layoutInflater)
        dialog.setContentView(sheet.root)

        sheet.tvBookingStationName.text = selectedStationName
        sheet.tvBookingSlotSchedule.text =
            "${selectedBookingDate.toBrowseDateLabel()}, ${slot.startTime} - ${slot.endTime}"
        sheet.tvBookingAvailableCapacity.text = "${slot.availableCapacity.toInt()} kWh"

        sheet.btnDismissBookingSheet.setOnClickListener { dialog.dismiss() }
        sheet.btnConfirmReservation.setOnClickListener {
            val requested = sheet.etReservationCapacity.text?.toString()?.toDoubleOrNull()
            when {
                requested == null || requested <= 0 -> {
                    sheet.tilReservationCapacity.error = "Enter the energy amount you need"
                }
                requested > slot.availableCapacity -> {
                    sheet.tilReservationCapacity.error = "Only ${slot.availableCapacity.toInt()} kWh is available"
                }
                else -> {
                    sheet.tilReservationCapacity.error = null
                    sheet.btnConfirmReservation.isEnabled = false

                    lifecycleScope.launch {
                        val result = reservationRepository.createReservation(slot.slotId, requested)
                        if (result.isSuccess) {
                            Toast.makeText(
                                requireContext(),
                                "✓ Successfully reserved ${requested.toInt()} kWh at $selectedStationName!",
                                Toast.LENGTH_LONG
                            ).show()
                            dialog.dismiss()
                            loadSlots() // Refresh slot list with updated capacity
                        } else {
                            sheet.btnConfirmReservation.isEnabled = true
                            val err = result.exceptionOrNull()?.message ?: "Booking failed"
                            sheet.tilReservationCapacity.error = err
                        }
                    }
                }
            }
        }
        dialog.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
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
