package com.smartsolar.mobile.ui.fragment.operator

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.databinding.FragmentOperatorNodesBinding
import com.smartsolar.mobile.ui.activity.GridOperatorActivity
import com.smartsolar.mobile.ui.adapter.OperatorNodeAdapter
import kotlinx.coroutines.launch

class OperatorNodesFragment : Fragment() {

    private var _binding: FragmentOperatorNodesBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: OperatorNodeAdapter
    private var operatorId: String = "chamithu"
    private var assignedStations: List<Station> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOperatorNodesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        operatorId = activity?.intent?.getStringExtra("OPERATOR_ID") ?: "chamithu"

        setupRecyclerView()
        setupListeners()
        loadAssignedNodes()
    }

    private fun setupRecyclerView() {
        adapter = OperatorNodeAdapter(
            onNodeDetailsClicked = { station ->
                val dialog = OperatorNodeDetailDialogFragment.newInstance(station)
                dialog.onStationUpdated = {
                    loadAssignedNodes()
                }
                dialog.show(parentFragmentManager, "NodeDetailDialog")
            },
            onManageSlotsClicked = { station ->
                // Navigate to Energy Slots and set the active station
                (activity as? GridOperatorActivity)?.let { act ->
                    act.preselectedStationId = station.stationId.ifBlank { station.id ?: "" }
                    act.navigateToTab(R.id.nav_grid_slots)
                }
            }
        )

        binding.rvOperatorNodes.layoutManager = LinearLayoutManager(requireContext())
        binding.rvOperatorNodes.adapter = adapter
    }

    private fun setupListeners() {
        binding.btnRefreshNodes.setOnClickListener {
            loadAssignedNodes(isManual = true)
        }
    }

    fun loadAssignedNodes(isManual: Boolean = false) {
        binding.pbNodesLoading.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getAssignedNodesByOperator(operatorId)
                binding.pbNodesLoading.visibility = View.GONE
                if (response.isSuccessful && response.body() != null) {
                    assignedStations = response.body()!!
                    submitStationsList(assignedStations)
                    if (isManual) {
                        Toast.makeText(requireContext(), "Assigned nodes refreshed (${assignedStations.size} loaded)", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    // Fallback to all stations filtered by operator ID
                    val allResp = RetrofitClient.apiService.getStations()
                    if (allResp.isSuccessful && allResp.body() != null) {
                        val filtered = allResp.body()!!.filter {
                            it.assignedOperatorId?.equals(operatorId, ignoreCase = true) == true ||
                                    it.assignedOperatorName?.equals(operatorId, ignoreCase = true) == true
                        }
                        assignedStations = if (filtered.isNotEmpty()) filtered else allResp.body()!!.take(2)
                        submitStationsList(assignedStations)
                    } else {
                        submitStationsList(emptyList())
                    }
                }
            } catch (e: Exception) {
                binding.pbNodesLoading.visibility = View.GONE
                val dbHelper = com.smartsolar.mobile.data.local.DatabaseHelper(requireContext())
                val cached = dbHelper.getAllStations()
                if (cached.isNotEmpty()) {
                    assignedStations = cached
                    submitStationsList(assignedStations)
                } else {
                    submitStationsList(emptyList())
                }
            }
        }
    }

    private fun submitStationsList(list: List<Station>) {
        adapter.submitList(list)
        binding.tvNodesSummaryCount.text = "${list.size} Microgrid Node(s) Assigned"
        binding.layoutEmptyNodes.visibility = if (list.isEmpty()) View.VISIBLE else View.GONE
        binding.rvOperatorNodes.visibility = if (list.isEmpty()) View.GONE else View.VISIBLE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
