package com.smartsolar.mobile.ui.fragment.operator

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import org.json.JSONObject
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.model.EnergySlot
import com.smartsolar.mobile.data.model.SlotCapacityUpdate
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.databinding.DialogOperatorCreateSlotBinding
import com.smartsolar.mobile.databinding.DialogOperatorUpdateSlotBinding
import com.smartsolar.mobile.databinding.FragmentOperatorSlotsBinding
import com.smartsolar.mobile.ui.activity.GridOperatorActivity
import com.smartsolar.mobile.ui.adapter.OperatorSlotAdapter
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class OperatorSlotsFragment : Fragment() {

    private var _binding: FragmentOperatorSlotsBinding? = null
    private val binding get() = _binding!!

    private lateinit var slotAdapter: OperatorSlotAdapter
    private var operatorId: String = ""
    private var assignedStations: List<Station> = emptyList()
    private var selectedStation: Station? = null
    private var selectedDate: String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    private var allSlots: List<EnergySlot> = emptyList()
    private var selectedStatus: String = "All"

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOperatorSlotsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        operatorId = activity?.intent?.getStringExtra("OPERATOR_ID")
            ?: context?.let { com.smartsolar.mobile.data.local.SessionManager.getUsername(it) }
            ?: ""

        setupRecyclerView()
        setupListeners()
        loadAssignedStations()
    }

    private fun setupRecyclerView() {
        slotAdapter = OperatorSlotAdapter(
            onUpdateAvailabilityClicked = { slot ->
                showUpdateAvailabilityDialog(slot)
            },
            onDeleteSlotClicked = { slot ->
                handleDeleteSlot(slot)
            }
        )

        binding.rvOperatorSlots.layoutManager = LinearLayoutManager(requireContext())
        binding.rvOperatorSlots.adapter = slotAdapter
    }

    private fun setupListeners() {
        binding.btnSelectSlotDate.setOnClickListener {
            showDatePicker()
        }

        binding.btnSwitchOperatorNode.setOnClickListener {
            showSwitchNodeDialog()
        }

        val statusOptions = arrayOf("All Statuses", "Available", "Closed")
        val statusAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, statusOptions)
        binding.actvSlotStatusFilter.setAdapter(statusAdapter)
        binding.actvSlotStatusFilter.setText(statusOptions[0], false)
        binding.actvSlotStatusFilter.setOnItemClickListener { _, _, position, _ ->
            selectedStatus = when (position) {
                1 -> "Available"
                2 -> "Closed"
                else -> "All"
            }
            binding.tvActiveFilterIndicator.text = "Filter: ${if (selectedStatus == "All") "All" else selectedStatus}"
            applySlotFilter()
        }

        binding.btnCreateSlot.setOnClickListener {
            val station = selectedStation
            if (station == null) {
                Toast.makeText(requireContext(), "No node selected", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            showCreateSlotDialog(station)
        }
    }

    private fun loadAssignedStations() {
        binding.pbSlotsLoading.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getAssignedNodesByOperator(operatorId)
                if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                    assignedStations = response.body()!!
                } else {
                    val allResp = RetrofitClient.apiService.getStations()
                    if (allResp.isSuccessful && allResp.body() != null) {
                        assignedStations = allResp.body()!!.filter {
                            it.assignedOperatorId?.equals(operatorId, ignoreCase = true) == true ||
                                    it.assignedOperatorName?.equals(operatorId, ignoreCase = true) == true
                        }.ifEmpty { allResp.body()!!.take(2) }
                    }
                }
            } catch (e: Exception) {
                val dbHelper = com.smartsolar.mobile.data.local.DatabaseHelper(requireContext())
                assignedStations = dbHelper.getAllStations()
            } finally {
                binding.pbSlotsLoading.visibility = View.GONE
            }

            // Check if activity passed a preselectedStationId
            val preselectedId = (activity as? GridOperatorActivity)?.preselectedStationId
            selectedStation = if (!preselectedId.isNullOrBlank()) {
                assignedStations.firstOrNull { it.stationId == preselectedId || it.id == preselectedId }
                    ?: assignedStations.firstOrNull()
            } else {
                assignedStations.firstOrNull()
            }

            updateSelectedStationBanner()
            loadSlotsForSelectedNode()
        }
    }

    private fun updateSelectedStationBanner() {
        val stn = selectedStation
        if (stn != null) {
            binding.tvSelectedOperatorNodeName.text = "${stn.stationName} (${stn.stationId})"
        } else {
            binding.tvSelectedOperatorNodeName.text = "No assigned nodes available"
        }
    }

    private fun showSwitchNodeDialog() {
        if (assignedStations.isEmpty()) {
            Toast.makeText(requireContext(), "No assigned nodes to select", Toast.LENGTH_SHORT).show()
            return
        }

        val names = assignedStations.map { "${it.stationName} (${it.stationId})" }.toTypedArray()
        AlertDialog.Builder(requireContext())
            .setTitle("Select Microgrid Node")
            .setItems(names) { _, which ->
                selectedStation = assignedStations[which]
                updateSelectedStationBanner()
                loadSlotsForSelectedNode()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showDatePicker() {
        val calendar = Calendar.getInstance()
        val dpd = DatePickerDialog(
            requireContext(),
            R.style.SmartSolar_DatePickerDialog,
            { _, year, month, dayOfMonth ->
                val cal = Calendar.getInstance()
                cal.set(year, month, dayOfMonth)
                selectedDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)
                binding.btnSelectSlotDate.text = "📅 $selectedDate"
                loadSlotsForSelectedNode()
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        )
        dpd.show()
    }

    private fun applySlotFilter() {
        val filtered = if (selectedStatus == "All") {
            allSlots
        } else {
            allSlots.filter { it.status.equals(selectedStatus, ignoreCase = true) }
        }
        slotAdapter.submitList(filtered)
        val filterLabel = if (selectedStatus == "All") "all" else selectedStatus.lowercase()
        binding.tvSlotsCountBadge.text = "${filtered.size} of ${allSlots.size} slots ($filterLabel)"
        binding.layoutEmptySlots.visibility = if (filtered.isEmpty()) View.VISIBLE else View.GONE
        binding.rvOperatorSlots.visibility = if (filtered.isEmpty()) View.GONE else View.VISIBLE
    }

    fun loadSlotsForSelectedNode() {
        val station = selectedStation ?: return
        val stationDocId = station.id?.ifBlank { station.stationId } ?: station.stationId

        binding.pbSlotsLoading.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getSlotsByStation(stationDocId, selectedDate)
                binding.pbSlotsLoading.visibility = View.GONE
                if (response.isSuccessful && response.body() != null) {
                    allSlots = response.body()!!
                    applySlotFilter()
                } else {
                    allSlots = emptyList()
                    applySlotFilter()
                }
            } catch (e: Exception) {
                binding.pbSlotsLoading.visibility = View.GONE
                // Fallback to local SQLite if offline
                val dbHelper = com.smartsolar.mobile.data.local.DatabaseHelper(requireContext())
                allSlots = dbHelper.getSlotsByStationAndDate(station.stationId, selectedDate)
                applySlotFilter()
            }
        }
    }

    private fun formatTimeTo24H(raw: String): String {
        val trimmed = raw.trim()
        if (trimmed.matches(Regex("^\\d{2}:\\d{2}:\\d{2}$"))) {
            return trimmed
        }
        if (trimmed.matches(Regex("^\\d{2}:\\d{2}$"))) {
            return "$trimmed:00"
        }
        if (trimmed.matches(Regex("^\\d{1}:\\d{2}$"))) {
            return "0$trimmed:00"
        }
        val formats = listOf("hh:mm a", "h:mm a", "hh:mma", "h:mma", "K:mm a", "KK:mm a")
        for (pattern in formats) {
            try {
                val sdf = SimpleDateFormat(pattern, Locale.US)
                val date = sdf.parse(trimmed.uppercase(Locale.US))
                if (date != null) {
                    return SimpleDateFormat("HH:mm:00", Locale.US).format(date)
                }
            } catch (_: Exception) {}
        }
        return trimmed
    }

    private fun showTimePicker(initialTime: String, onTimeSelected: (String) -> Unit) {
        var hour = 8
        var minute = 0
        try {
            val parts = initialTime.split(":")
            if (parts.size >= 2) {
                hour = parts[0].trim().toIntOrNull() ?: 8
                val minClean = parts[1].trim().take(2)
                minute = minClean.toIntOrNull() ?: 0
            }
        } catch (_: Exception) {}

        TimePickerDialog(
            requireContext(),
            { _, selectedHour, selectedMinute ->
                val formatted = String.format(Locale.US, "%02d:%02d:00", selectedHour, selectedMinute)
                onTimeSelected(formatted)
            },
            hour,
            minute,
            true
        ).show()
    }

    private fun showCreateSlotDialog(station: Station) {
        val bottomSheet = BottomSheetDialog(requireContext())
        val dialogBinding = DialogOperatorCreateSlotBinding.inflate(layoutInflater)
        bottomSheet.setContentView(dialogBinding.root)

        val autoSlotId = "SLOT-${(100000..999999).random()}"
        dialogBinding.tvCreateSlotStationBanner.text = "For Node: ${station.stationName} (${station.stationId})"
        dialogBinding.etCreateSlotId.setText(autoSlotId)
        dialogBinding.etCreateSlotDate.setText(selectedDate)
        dialogBinding.etCreateSlotStartTime.setText("08:00:00")
        dialogBinding.etCreateSlotEndTime.setText("12:00:00")
        dialogBinding.etCreateSlotCapacity.setText("50.0")

        val openDatePicker = {
            val cal = Calendar.getInstance()
            DatePickerDialog(
                requireContext(),
                R.style.SmartSolar_DatePickerDialog,
                { _, y, m, d ->
                    val c = Calendar.getInstance()
                    c.set(y, m, d)
                    dialogBinding.etCreateSlotDate.setText(
                        SimpleDateFormat("yyyy-MM-dd", Locale.US).format(c.time)
                    )
                },
                cal.get(Calendar.YEAR),
                cal.get(Calendar.MONTH),
                cal.get(Calendar.DAY_OF_MONTH)
            ).show()
        }
        dialogBinding.etCreateSlotDate.setOnClickListener { openDatePicker() }
        dialogBinding.tilCreateSlotDate.setEndIconOnClickListener { openDatePicker() }

        val openStartTimePicker = {
            showTimePicker(dialogBinding.etCreateSlotStartTime.text?.toString() ?: "08:00:00") { time ->
                dialogBinding.etCreateSlotStartTime.setText(time)
            }
        }
        dialogBinding.etCreateSlotStartTime.setOnClickListener { openStartTimePicker() }
        dialogBinding.tilCreateSlotStartTime.setOnClickListener { openStartTimePicker() }

        val openEndTimePicker = {
            showTimePicker(dialogBinding.etCreateSlotEndTime.text?.toString() ?: "12:00:00") { time ->
                dialogBinding.etCreateSlotEndTime.setText(time)
            }
        }
        dialogBinding.etCreateSlotEndTime.setOnClickListener { openEndTimePicker() }
        dialogBinding.tilCreateSlotEndTime.setOnClickListener { openEndTimePicker() }

        val statusChoices = arrayOf("Available", "Closed")
        val statusAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, statusChoices)
        dialogBinding.actvCreateSlotStatus.setAdapter(statusAdapter)
        dialogBinding.actvCreateSlotStatus.setText(statusChoices[0], false)

        dialogBinding.btnCancelCreateSlot.setOnClickListener {
            bottomSheet.dismiss()
        }

        dialogBinding.btnSubmitCreateSlot.setOnClickListener {
            val slotIdInput = dialogBinding.etCreateSlotId.text?.toString()?.trim().orEmpty()
            val slotId = if (slotIdInput.isNotBlank()) slotIdInput.uppercase(Locale.US) else autoSlotId
            val date = dialogBinding.etCreateSlotDate.text?.toString()?.trim().orEmpty()
            val startRaw = dialogBinding.etCreateSlotStartTime.text?.toString()?.trim().orEmpty()
            val endRaw = dialogBinding.etCreateSlotEndTime.text?.toString()?.trim().orEmpty()
            val capStr = dialogBinding.etCreateSlotCapacity.text?.toString()?.trim().orEmpty()
            val capVal = capStr.toDoubleOrNull() ?: 50.0
            val statusInput = dialogBinding.actvCreateSlotStatus.text?.toString()?.trim().orEmpty().ifBlank { "Available" }

            if (date.isBlank() || startRaw.isBlank() || endRaw.isBlank()) {
                Toast.makeText(requireContext(), "Please fill in all date and time fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (capVal <= 0) {
                Toast.makeText(requireContext(), "Total capacity must be greater than zero", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val startFormatted = formatTimeTo24H(startRaw)
            val endFormatted = formatTimeTo24H(endRaw)

            if (startFormatted >= endFormatted) {
                Toast.makeText(requireContext(), "Start time must be before end time ($startFormatted - $endFormatted)", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val stationTargetId = station.stationId.ifBlank { station.id.orEmpty() }
            val dateClean = if (date.contains("T")) date.split("T")[0] else date
            val dateIso = "${dateClean}T00:00:00Z"
            val newSlot = EnergySlot(
                slotId = slotId,
                stationId = station.stationId,
                date = dateIso,
                startTime = startFormatted,
                endTime = endFormatted,
                totalCapacity = capVal,
                availableCapacity = capVal,
                status = statusInput
            )

            dialogBinding.btnSubmitCreateSlot.isEnabled = false
            dialogBinding.btnSubmitCreateSlot.text = "Publishing..."

            lifecycleScope.launch {
                try {
                    val response = RetrofitClient.apiService.createSlot(stationTargetId, newSlot)
                    if (response.isSuccessful) {
                        Toast.makeText(requireContext(), "Energy slot $slotId published successfully!", Toast.LENGTH_SHORT).show()
                        bottomSheet.dismiss()
                        loadSlotsForSelectedNode()
                    } else {
                        val errorDetail = try {
                            val errStr = response.errorBody()?.string().orEmpty()
                            val json = JSONObject(errStr)
                            json.optString("message").ifBlank {
                                val errorsObj = json.optJSONObject("errors")
                                errorsObj?.toString() ?: errStr
                            }
                        } catch (e: Exception) {
                            "Status code: ${response.code()}"
                        }
                        Toast.makeText(requireContext(), "Failed to create slot: $errorDetail", Toast.LENGTH_LONG).show()
                        dialogBinding.btnSubmitCreateSlot.isEnabled = true
                        dialogBinding.btnSubmitCreateSlot.text = "Publish Slot"
                    }
                } catch (e: Exception) {
                    Toast.makeText(requireContext(), "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                    dialogBinding.btnSubmitCreateSlot.isEnabled = true
                    dialogBinding.btnSubmitCreateSlot.text = "Publish Slot"
                }
            }
        }

        bottomSheet.show()
    }

    private fun showUpdateAvailabilityDialog(slot: EnergySlot) {
        val bottomSheet = BottomSheetDialog(requireContext())
        val dialogBinding = DialogOperatorUpdateSlotBinding.inflate(layoutInflater)
        bottomSheet.setContentView(dialogBinding.root)

        dialogBinding.tvUpdateSlotBanner.text = "${slot.slotId} • ${slot.startTime} - ${slot.endTime}"
        dialogBinding.tvUpdateSlotTotalCap.text = "Total: ${slot.totalCapacity} kWh"
        dialogBinding.tvUpdateSlotCurrentAvail.text = "Available: ${slot.availableCapacity} kWh"
        dialogBinding.etUpdateSlotAvailable.setText(slot.availableCapacity.toString())

        val statusChoices = arrayOf("Available", "Closed")
        val statusAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, statusChoices)
        dialogBinding.actvUpdateSlotStatus.setAdapter(statusAdapter)
        val initialStatus = if (slot.status.equals("Closed", ignoreCase = true)) "Closed" else "Available"
        dialogBinding.actvUpdateSlotStatus.setText(initialStatus, false)

        dialogBinding.btnCancelUpdateSlot.setOnClickListener {
            bottomSheet.dismiss()
        }

        dialogBinding.btnSubmitUpdateSlot.setOnClickListener {
            val availStr = dialogBinding.etUpdateSlotAvailable.text?.toString()?.trim()
            val availVal = availStr?.toDoubleOrNull()
            val selectedNewStatus = dialogBinding.actvUpdateSlotStatus.text?.toString()?.trim().orEmpty().ifBlank { slot.status }

            if (availVal == null || availVal < 0 || availVal > slot.totalCapacity) {
                dialogBinding.tilUpdateSlotAvailable.error = "Capacity must be between 0 and ${slot.totalCapacity} kWh"
                return@setOnClickListener
            }
            dialogBinding.tilUpdateSlotAvailable.error = null

            dialogBinding.btnSubmitUpdateSlot.isEnabled = false
            dialogBinding.btnSubmitUpdateSlot.text = "Saving..."

            val slotDocId = slot.id?.ifBlank { slot.slotId } ?: slot.slotId
            val dateClean = if (slot.date.contains("T")) slot.date.split("T")[0] else slot.date
            val updatedSlot = slot.copy(
                date = "${dateClean}T00:00:00Z",
                availableCapacity = availVal,
                status = selectedNewStatus
            )

            lifecycleScope.launch {
                try {
                    val response = RetrofitClient.apiService.updateSlot(slotDocId, updatedSlot)
                    if (response.isSuccessful) {
                        Toast.makeText(requireContext(), "Slot '$slotDocId' updated to $selectedNewStatus!", Toast.LENGTH_SHORT).show()
                        bottomSheet.dismiss()
                        loadSlotsForSelectedNode()
                    } else {
                        val errorDetail = parseErrorMessage(response.errorBody()?.string())
                        Toast.makeText(requireContext(), "Failed to update slot: $errorDetail", Toast.LENGTH_LONG).show()
                        dialogBinding.btnSubmitUpdateSlot.isEnabled = true
                        dialogBinding.btnSubmitUpdateSlot.text = "Save Changes"
                    }
                } catch (e: Exception) {
                    Toast.makeText(requireContext(), "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                    dialogBinding.btnSubmitUpdateSlot.isEnabled = true
                    dialogBinding.btnSubmitUpdateSlot.text = "Save Changes"
                }
            }
        }

        bottomSheet.show()
    }

    private fun handleDeleteSlot(slot: EnergySlot) {
        val total = slot.totalCapacity
        val available = slot.availableCapacity
        val booked = if (total > available) total - available else 0.0
        val isClosed = slot.status.equals("Closed", ignoreCase = true)
        val slotDocId = slot.id?.ifBlank { slot.slotId } ?: slot.slotId

        // Check 1: Reserved energy check
        if (booked > 0.001) {
            AlertDialog.Builder(requireContext())
                .setTitle("Cannot Delete Slot")
                .setMessage("User has reserved energy (${String.format(Locale.US, "%.1f", booked)} kWh) for this slot. Slots with active reservations cannot be deleted or closed.")
                .setPositiveButton("OK", null)
                .show()
            return
        }

        // Check 2: If Available, prompt to Close first
        if (!isClosed) {
            AlertDialog.Builder(requireContext())
                .setTitle("Slot is Available")
                .setMessage("Only closed slots can be deleted. Would you like to close slot '${slot.slotId}' now?")
                .setPositiveButton("Close Slot") { _, _ ->
                    closeSlot(slotDocId, slot.slotId)
                }
                .setNegativeButton("Cancel", null)
                .show()
            return
        }

        // Check 3: If Closed and no reserved energy, confirm permanent deletion
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Energy Slot")
            .setMessage("Are you sure you want to permanently delete slot '${slot.slotId}'? This action cannot be undone.")
            .setPositiveButton("Delete") { _, _ ->
                deleteSlot(slotDocId, slot.slotId)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun closeSlot(slotDocId: String, slotId: String) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.closeSlot(slotDocId)
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "Slot '$slotId' closed successfully!", Toast.LENGTH_SHORT).show()
                    loadSlotsForSelectedNode()
                } else {
                    val errorDetail = parseErrorMessage(response.errorBody()?.string())
                    Toast.makeText(requireContext(), "Cannot close slot: $errorDetail", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun deleteSlot(slotDocId: String, slotId: String) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.deleteSlot(slotDocId)
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "Energy slot '$slotId' deleted successfully!", Toast.LENGTH_SHORT).show()
                    loadSlotsForSelectedNode()
                } else {
                    val errorDetail = parseErrorMessage(response.errorBody()?.string())
                    Toast.makeText(requireContext(), "Cannot delete slot: $errorDetail", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun parseErrorMessage(rawError: String?): String {
        if (rawError.isNullOrBlank()) return "An error occurred"
        return try {
            val json = JSONObject(rawError)
            json.optString("message").ifBlank {
                json.optJSONObject("errors")?.toString() ?: rawError
            }
        } catch (_: Exception) {
            rawError
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
