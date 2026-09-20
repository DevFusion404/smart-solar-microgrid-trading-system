package com.smartsolar.mobile.ui.fragment.operator

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.bottomsheet.BottomSheetDialog
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
            { _, year, month, dayOfMonth ->
                val cal = Calendar.getInstance()
                cal.set(year, month, dayOfMonth)
                selectedDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)
                binding.btnSelectSlotDate.text = "📅 Date: $selectedDate"
                loadSlotsForSelectedNode()
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        )
        dpd.show()
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
                    val slots = response.body()!!
                    slotAdapter.submitList(slots)
                    binding.tvSlotsCountBadge.text = "${slots.size} slot(s) for $selectedDate"
                    binding.layoutEmptySlots.visibility = if (slots.isEmpty()) View.VISIBLE else View.GONE
                    binding.rvOperatorSlots.visibility = if (slots.isEmpty()) View.GONE else View.VISIBLE
                } else {
                    slotAdapter.submitList(emptyList())
                    binding.layoutEmptySlots.visibility = View.VISIBLE
                    binding.rvOperatorSlots.visibility = View.GONE
                    binding.tvSlotsCountBadge.text = "0 slots"
                }
            } catch (e: Exception) {
                binding.pbSlotsLoading.visibility = View.GONE
                // Fallback to local SQLite if offline
                val dbHelper = com.smartsolar.mobile.data.local.DatabaseHelper(requireContext())
                val localSlots = dbHelper.getSlotsByStationAndDate(station.stationId, selectedDate)
                slotAdapter.submitList(localSlots)
                binding.layoutEmptySlots.visibility = if (localSlots.isEmpty()) View.VISIBLE else View.GONE
                binding.rvOperatorSlots.visibility = if (localSlots.isEmpty()) View.GONE else View.VISIBLE
                binding.tvSlotsCountBadge.text = "${localSlots.size} slot(s) cached"
            }
        }
    }

    private fun showCreateSlotDialog(station: Station) {
        val bottomSheet = BottomSheetDialog(requireContext())
        val dialogBinding = DialogOperatorCreateSlotBinding.inflate(layoutInflater)
        bottomSheet.setContentView(dialogBinding.root)

        dialogBinding.tvCreateSlotStationBanner.text = "For Node: ${station.stationName} (${station.stationId})"
        dialogBinding.etCreateSlotDate.setText(selectedDate)
        dialogBinding.etCreateSlotStartTime.setText("08:00 AM")
        dialogBinding.etCreateSlotEndTime.setText("12:00 PM")
        dialogBinding.etCreateSlotCapacity.setText("50.0")

        dialogBinding.btnCancelCreateSlot.setOnClickListener {
            bottomSheet.dismiss()
        }

        dialogBinding.btnSubmitCreateSlot.setOnClickListener {
            val date = dialogBinding.etCreateSlotDate.text?.toString()?.trim().orEmpty()
            val start = dialogBinding.etCreateSlotStartTime.text?.toString()?.trim().orEmpty()
            val end = dialogBinding.etCreateSlotEndTime.text?.toString()?.trim().orEmpty()
            val capStr = dialogBinding.etCreateSlotCapacity.text?.toString()?.trim().orEmpty()
            val capVal = capStr.toDoubleOrNull() ?: 50.0

            if (date.isBlank() || start.isBlank() || end.isBlank()) {
                Toast.makeText(requireContext(), "Please fill in all date and time fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val stationDocId = station.id?.ifBlank { station.stationId } ?: station.stationId
            val newSlot = EnergySlot(
                stationId = station.stationId,
                date = date,
                startTime = start,
                endTime = end,
                totalCapacity = capVal,
                availableCapacity = capVal,
                status = "Available"
            )

            dialogBinding.btnSubmitCreateSlot.isEnabled = false
            dialogBinding.btnSubmitCreateSlot.text = "Publishing..."

            lifecycleScope.launch {
                try {
                    val response = RetrofitClient.apiService.createSlot(stationDocId, newSlot)
                    if (response.isSuccessful) {
                        Toast.makeText(requireContext(), "Energy slot published successfully!", Toast.LENGTH_SHORT).show()
                        bottomSheet.dismiss()
                        loadSlotsForSelectedNode()
                    } else {
                        Toast.makeText(requireContext(), "Failed to create slot: ${response.code()}", Toast.LENGTH_SHORT).show()
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

        dialogBinding.btnCancelUpdateSlot.setOnClickListener {
            bottomSheet.dismiss()
        }

        dialogBinding.btnSubmitUpdateSlot.setOnClickListener {
            val availStr = dialogBinding.etUpdateSlotAvailable.text?.toString()?.trim()
            val availVal = availStr?.toDoubleOrNull()

            if (availVal == null || availVal < 0 || availVal > slot.totalCapacity) {
                dialogBinding.tilUpdateSlotAvailable.error = "Capacity must be between 0 and ${slot.totalCapacity} kWh"
                return@setOnClickListener
            }
            dialogBinding.tilUpdateSlotAvailable.error = null

            dialogBinding.btnSubmitUpdateSlot.isEnabled = false
            dialogBinding.btnSubmitUpdateSlot.text = "Saving..."

            val slotDocId = slot.id?.ifBlank { slot.slotId } ?: slot.slotId
            lifecycleScope.launch {
                try {
                    val response = RetrofitClient.apiService.adjustCapacity(
                        slotDocId,
                        SlotCapacityUpdate(availableCapacity = availVal)
                    )
                    if (response.isSuccessful) {
                        Toast.makeText(requireContext(), "Slot availability capacity updated!", Toast.LENGTH_SHORT).show()
                        bottomSheet.dismiss()
                        loadSlotsForSelectedNode()
                    } else {
                        Toast.makeText(requireContext(), "Failed to update capacity: ${response.code()}", Toast.LENGTH_SHORT).show()
                        dialogBinding.btnSubmitUpdateSlot.isEnabled = true
                        dialogBinding.btnSubmitUpdateSlot.text = "💾 Save Availability"
                    }
                } catch (e: Exception) {
                    Toast.makeText(requireContext(), "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                    dialogBinding.btnSubmitUpdateSlot.isEnabled = true
                    dialogBinding.btnSubmitUpdateSlot.text = "💾 Save Availability"
                }
            }
        }

        bottomSheet.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
