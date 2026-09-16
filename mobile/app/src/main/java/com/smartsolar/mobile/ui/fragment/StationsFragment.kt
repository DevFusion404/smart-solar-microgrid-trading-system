package com.smartsolar.mobile.ui.fragment

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.data.repository.StationRepository
import com.smartsolar.mobile.databinding.FragmentStationsBinding
import com.smartsolar.mobile.ui.adapter.StationAdapter
import kotlinx.coroutines.launch

class StationsFragment : Fragment(R.layout.fragment_stations) {

    private var _binding: FragmentStationsBinding? = null
    private val binding get() = _binding!!

    private lateinit var stationRepository: StationRepository
    private lateinit var stationAdapter: StationAdapter

    private var allStations: List<Station> = emptyList()
    private var currentSearchQuery: String = ""
    private var currentStatusFilter: String = "ALL" // ALL, ACTIVE, DEACTIVATED

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentStationsBinding.bind(view)

        stationRepository = StationRepository(requireContext())
        setupRecyclerView()
        setupSearchAndFilters()
        setupListeners()

        loadStations(forceRefresh = false)
    }

    private fun setupRecyclerView() {
        stationAdapter = StationAdapter(
            initialStations = emptyList(),
            onReserveEnergy = { station ->
                navigateToReserveEnergy(station)
            },
            onStationClick = { station ->
                navigateToReserveEnergy(station)
            }
        )

        binding.rvStations.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = stationAdapter
        }
    }

    private fun setupSearchAndFilters() {
        // Search text watcher
        binding.etSearchStations.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                currentSearchQuery = s?.toString()?.trim() ?: ""
                binding.btnClearSearch.visibility = if (currentSearchQuery.isNotEmpty()) View.VISIBLE else View.GONE
                applyFilters()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        binding.btnClearSearch.setOnClickListener {
            binding.etSearchStations.text?.clear()
        }

        // Chip group filter
        binding.chipGroupStationFilters.setOnCheckedStateChangeListener { _, checkedIds ->
            currentStatusFilter = when (checkedIds.firstOrNull()) {
                R.id.chipActiveStations -> "ACTIVE"
                R.id.chipDeactivatedStations -> "DEACTIVATED"
                else -> "ALL"
            }
            applyFilters()
        }
    }

    private fun setupListeners() {
        binding.btnRefreshStations.setOnClickListener {
            loadStations(forceRefresh = true)
        }
    }

    private fun loadStations(forceRefresh: Boolean) {
        binding.pbStationsLoading.visibility = View.VISIBLE
        binding.layoutEmptyStations.visibility = View.GONE

        lifecycleScope.launch {
            val result = stationRepository.getStations(forceRefresh = forceRefresh)
            binding.pbStationsLoading.visibility = View.GONE

            if (result.isSuccess) {
                allStations = result.getOrNull() ?: emptyList()
                applyFilters()
                if (forceRefresh) {
                    Toast.makeText(requireContext(), "Stations refreshed (${allStations.size} loaded)", Toast.LENGTH_SHORT).show()
                }
            } else {
                val error = result.exceptionOrNull()?.message ?: "Failed to load stations"
                Toast.makeText(requireContext(), error, Toast.LENGTH_SHORT).show()
                applyFilters()
            }
        }
    }

    private fun applyFilters() {
        val filtered = allStations.filter { station ->
            val matchesQuery = currentSearchQuery.isBlank() ||
                    station.stationName.contains(currentSearchQuery, ignoreCase = true) ||
                    station.stationId.contains(currentSearchQuery, ignoreCase = true) ||
                    station.address.contains(currentSearchQuery, ignoreCase = true)

            val matchesStatus = when (currentStatusFilter) {
                "ACTIVE" -> station.status.equals("Active", ignoreCase = true)
                "DEACTIVATED" -> station.status.equals("Deactivated", ignoreCase = true)
                else -> true
            }

            matchesQuery && matchesStatus
        }

        stationAdapter.submitStations(filtered)

        // Update summary text
        val activeCount = filtered.count { it.status.equals("Active", ignoreCase = true) }
        binding.tvStationsSummary.text = "Showing ${filtered.size} stations ($activeCount active)"

        // Empty state visibility
        binding.layoutEmptyStations.visibility = if (filtered.isEmpty()) View.VISIBLE else View.GONE
        binding.rvStations.visibility = if (filtered.isEmpty()) View.GONE else View.VISIBLE
    }

    private fun navigateToReserveEnergy(station: Station) {
        val fragment = ReserveEnergyFragment.newInstance(
            stationId = station.stationId.ifBlank { station.id ?: "" },
            stationName = station.stationName,
            stationAddress = station.address
        )

        parentFragmentManager.beginTransaction()
            .setCustomAnimations(android.R.anim.fade_in, android.R.anim.fade_out)
            .replace(R.id.fragmentContainer, fragment)
            .addToBackStack("stations")
            .commit()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
