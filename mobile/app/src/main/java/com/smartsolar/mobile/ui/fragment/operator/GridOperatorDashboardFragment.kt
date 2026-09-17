package com.smartsolar.mobile.ui.fragment.operator

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.databinding.FragmentGridOperatorDashboardBinding
import com.smartsolar.mobile.ui.activity.GridOperatorActivity
import kotlinx.coroutines.launch

class GridOperatorDashboardFragment : Fragment() {

    private var _binding: FragmentGridOperatorDashboardBinding? = null
    private val binding get() = _binding!!

    private var operatorId: String = "chamithu"
    private var operatorName: String = "Chamithu"
    private var assignedStations: List<Station> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentGridOperatorDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        operatorId = activity?.intent?.getStringExtra("OPERATOR_ID") ?: "chamithu"
        operatorName = activity?.intent?.getStringExtra("USER_NAME") ?: "Chamithu"

        binding.tvDashboardWelcome.text = "Good day, $operatorName"

        setupClickListeners()
        loadDashboardData()
    }

    private fun setupClickListeners() {
        binding.btnRefreshDashboard.setOnClickListener {
            loadDashboardData(isManual = true)
        }

        binding.cardKpiNodes.setOnClickListener {
            (activity as? GridOperatorActivity)?.navigateToTab(R.id.nav_grid_nodes)
        }

        binding.cardActionMyNodes.setOnClickListener {
            (activity as? GridOperatorActivity)?.navigateToTab(R.id.nav_grid_nodes)
        }

        binding.cardKpiSlots.setOnClickListener {
            (activity as? GridOperatorActivity)?.navigateToTab(R.id.nav_grid_slots)
        }

        binding.cardActionSlots.setOnClickListener {
            (activity as? GridOperatorActivity)?.navigateToTab(R.id.nav_grid_slots)
        }

        binding.cardKpiBattery.setOnClickListener {
            if (assignedStations.isNotEmpty()) {
                val dialog = OperatorNodeDetailDialogFragment.newInstance(assignedStations.first())
                dialog.onStationUpdated = {
                    loadDashboardData()
                }
                dialog.show(parentFragmentManager, "NodeDetailDialog")
            } else {
                (activity as? GridOperatorActivity)?.navigateToTab(R.id.nav_grid_nodes)
            }
        }

        binding.cardActionBookings.setOnClickListener {
            (activity as? GridOperatorActivity)?.navigateToTab(R.id.nav_grid_bookings)
        }
    }

    fun loadDashboardData(isManual: Boolean = false) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getAssignedNodesByOperator(operatorId)
                if (response.isSuccessful && response.body() != null) {
                    assignedStations = response.body()!!
                    updateKpis(assignedStations)
                    if (isManual) {
                        Toast.makeText(requireContext(), "Dashboard refreshed (${assignedStations.size} nodes)", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    // Fallback to all stations if operator route returned empty or restricted
                    val allResp = RetrofitClient.apiService.getStations()
                    if (allResp.isSuccessful && allResp.body() != null) {
                        val filtered = allResp.body()!!.filter {
                            it.assignedOperatorId?.equals(operatorId, ignoreCase = true) == true ||
                                    it.assignedOperatorName?.equals(operatorId, ignoreCase = true) == true
                        }
                        assignedStations = if (filtered.isNotEmpty()) filtered else allResp.body()!!.take(2)
                        updateKpis(assignedStations)
                    }
                }
            } catch (e: Exception) {
                // If offline or network error, fallback gracefully
                val dbHelper = com.smartsolar.mobile.data.local.DatabaseHelper(requireContext())
                val localStations = dbHelper.getAllStations()
                if (localStations.isNotEmpty()) {
                    assignedStations = localStations
                    updateKpis(assignedStations)
                }
            }
        }
    }

    private fun updateKpis(stations: List<Station>) {
        val totalNodes = stations.size
        val activeNodes = stations.count { it.status.equals("Active", ignoreCase = true) }
        val totalSolar = stations.sumOf { it.energyCapacity }
        val totalBattery = stations.sumOf { it.batteryStorageCapacity }

        binding.tvStatAssignedNodes.text = totalNodes.toString()
        binding.tvStatNodesSub.text = "$activeNodes Active Online"
        binding.tvStatSolarCapacity.text = "${totalSolar.toInt()} kWh"
        binding.tvStatBatteryStorage.text = "${totalBattery.toInt()} kWh"
        binding.tvStatPublishedSlots.text = "${totalNodes * 3} Slots"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
