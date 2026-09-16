package com.smartsolar.mobile.ui.fragment

import android.content.Context
import android.content.res.ColorStateList
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.data.repository.StationRepository
import com.smartsolar.mobile.databinding.FragmentStationsBinding
import com.smartsolar.mobile.ui.adapter.StationAdapter
import kotlinx.coroutines.launch
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.BoundingBox
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.overlay.Marker

class StationsFragment : Fragment(R.layout.fragment_stations) {

    private var _binding: FragmentStationsBinding? = null
    private val binding get() = _binding!!

    private lateinit var stationRepository: StationRepository
    private lateinit var stationAdapter: StationAdapter

    private var allStations: List<Station> = emptyList()
    private var filteredStations: List<Station> = emptyList()
    private var currentSearchQuery: String = ""
    private var currentStatusFilter: String = "ALL" // ALL, ACTIVE, DEACTIVATED
    private var isMapViewActive: Boolean = false

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentStationsBinding.bind(view)

        // Initialize OSMDroid Configuration
        val ctx = requireContext()
        Configuration.getInstance().load(ctx, ctx.getSharedPreferences("osmdroid", Context.MODE_PRIVATE))
        Configuration.getInstance().userAgentValue = ctx.packageName

        stationRepository = StationRepository(ctx)
        setupRecyclerView()
        setupSearchAndFilters()
        setupViewSwitchButtons()
        setupListeners()
        setupOsmMap()

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

    private fun setupOsmMap() {
        binding.mapViewStations.apply {
            setTileSource(TileSourceFactory.MAPNIK)
            setMultiTouchControls(true)

            // Disable repeated world map horizontally and vertically
            isHorizontalMapRepetitionEnabled = false
            isVerticalMapRepetitionEnabled = false

            // Strictly restrict scrollable map boundary to Sri Lanka
            val sriLankaNorth = 10.05
            val sriLankaEast = 82.10
            val sriLankaSouth = 5.75
            val sriLankaWest = 79.40
            val sriLankaBox = BoundingBox(sriLankaNorth, sriLankaEast, sriLankaSouth, sriLankaWest)
            setScrollableAreaLimitDouble(sriLankaBox)

            minZoomLevel = 7.5
            maxZoomLevel = 19.0

            // Center strictly on Sri Lanka (Colombo)
            val location = GeoPoint(6.9271, 79.8612)
            controller.setZoom(9.5)
            controller.setCenter(location)
        }
    }

    private fun setupViewSwitchButtons() {
        binding.btnViewList.setOnClickListener {
            selectViewTab(isMap = false)
        }
        binding.btnViewMap.setOnClickListener {
            selectViewTab(isMap = true)
        }
    }

    private fun selectViewTab(isMap: Boolean) {
        if (isMapViewActive == isMap) return
        isMapViewActive = isMap
        val ctx = requireContext()

        if (isMap) {
            binding.btnViewMap.backgroundTintList = ColorStateList.valueOf(ctx.getColor(R.color.white))
            binding.btnViewMap.setTextColor(ctx.getColor(R.color.slate_950))
            binding.btnViewMap.iconTint = ColorStateList.valueOf(ctx.getColor(R.color.slate_950))

            binding.btnViewList.backgroundTintList = ColorStateList.valueOf(ctx.getColor(R.color.transparent))
            binding.btnViewList.setTextColor(ctx.getColor(R.color.white))
            binding.btnViewList.iconTint = ColorStateList.valueOf(ctx.getColor(R.color.white))
        } else {
            binding.btnViewList.backgroundTintList = ColorStateList.valueOf(ctx.getColor(R.color.white))
            binding.btnViewList.setTextColor(ctx.getColor(R.color.slate_950))
            binding.btnViewList.iconTint = ColorStateList.valueOf(ctx.getColor(R.color.slate_950))

            binding.btnViewMap.backgroundTintList = ColorStateList.valueOf(ctx.getColor(R.color.transparent))
            binding.btnViewMap.setTextColor(ctx.getColor(R.color.white))
            binding.btnViewMap.iconTint = ColorStateList.valueOf(ctx.getColor(R.color.white))
            binding.cardMapStationPreview.visibility = View.GONE
        }

        applyFilters()
    }

    private fun setupSearchAndFilters() {
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
        filteredStations = allStations.filter { station ->
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

        stationAdapter.submitStations(filteredStations)

        val activeCount = filteredStations.count { it.status.equals("Active", ignoreCase = true) }
        binding.tvStationsSummary.text = "Showing ${filteredStations.size} stations ($activeCount active)"

        updateMapMarkers(filteredStations)

        if (isMapViewActive) {
            binding.rvStations.visibility = View.GONE
            binding.layoutEmptyStations.visibility = View.GONE
            binding.layoutMapView.visibility = View.VISIBLE
        } else {
            binding.layoutMapView.visibility = View.GONE
            binding.cardMapStationPreview.visibility = View.GONE
            binding.layoutEmptyStations.visibility = if (filteredStations.isEmpty()) View.VISIBLE else View.GONE
            binding.rvStations.visibility = if (filteredStations.isEmpty()) View.GONE else View.VISIBLE
        }
    }

    private fun updateMapMarkers(stations: List<Station>) {
        val mapView = _binding?.mapViewStations ?: return
        mapView.overlays.clear()

        val validStations = stations.filter { it.latitude != 0.0 || it.longitude != 0.0 }

        if (validStations.isEmpty()) {
            binding.layoutEmptyMap.visibility = if (stations.isEmpty()) View.VISIBLE else View.GONE
            binding.tvMapMarkerHint.text = "No station coordinates available"
            binding.cardMapStationPreview.visibility = View.GONE
            mapView.invalidate()
            return
        }

        binding.layoutEmptyMap.visibility = View.GONE
        binding.tvMapMarkerHint.text = "Showing ${validStations.size} station(s) on map • Tap marker to view slots"

        val activePin = ContextCompat.getDrawable(requireContext(), R.drawable.ic_map_pin_active)
        val deactivatedPin = ContextCompat.getDrawable(requireContext(), R.drawable.ic_map_pin_deactivated)

        for (station in validStations) {
            val point = GeoPoint(station.latitude, station.longitude)
            val isActive = station.status.equals("Active", ignoreCase = true)
            val marker = Marker(mapView).apply {
                position = point
                title = station.stationName
                snippet = station.address
                relatedObject = station
                icon = if (isActive) activePin else deactivatedPin
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                setOnMarkerClickListener { _, _ ->
                    showStationPreview(station)
                    mapView.controller.animateTo(point)
                    true
                }
            }
            mapView.overlays.add(marker)
        }

        mapView.invalidate()

        if (isMapViewActive) {
            if (validStations.size == 1) {
                val singlePoint = GeoPoint(validStations.first().latitude, validStations.first().longitude)
                mapView.controller.setZoom(14.0)
                mapView.controller.animateTo(singlePoint)
            } else {
                var minLat = Double.MAX_VALUE
                var maxLat = -Double.MAX_VALUE
                var minLon = Double.MAX_VALUE
                var maxLon = -Double.MAX_VALUE
                for (s in validStations) {
                    minLat = minOf(minLat, s.latitude)
                    maxLat = maxOf(maxLat, s.latitude)
                    minLon = minOf(minLon, s.longitude)
                    maxLon = maxOf(maxLon, s.longitude)
                }
                val box = BoundingBox(maxLat + 0.04, maxLon + 0.04, minLat - 0.04, minLon - 0.04)
                mapView.zoomToBoundingBox(box, true)
            }
        }
    }

    private fun showStationPreview(station: Station) {
        val b = _binding ?: return
        b.cardMapStationPreview.visibility = View.VISIBLE
        b.tvPreviewStationName.text = station.stationName
        b.tvPreviewAddress.text = station.address.ifBlank { "Location details available" }
        b.tvPreviewCapacity.text = "⚡ ${station.energyCapacity} kW Capacity"
        b.tvPreviewBattery.text = "🔋 ${station.batteryStorageCapacity} kWh Battery"

        val isActive = station.status.equals("Active", ignoreCase = true)
        b.tvPreviewStatusBadge.text = if (isActive) "Active" else "Deactivated"
        b.tvPreviewStatusBadge.setBackgroundResource(
            if (isActive) R.drawable.bg_reservation_status_available
            else R.drawable.bg_reservation_status_completed
        )
        b.tvPreviewStatusBadge.setTextColor(
            requireContext().getColor(
                if (isActive) R.color.reservation_green
                else R.color.slate_500
            )
        )

        b.btnMapReserveEnergy.setOnClickListener {
            navigateToReserveEnergy(station)
        }
        b.cardMapStationPreview.setOnClickListener {
            navigateToReserveEnergy(station)
        }
        b.btnCloseMapPreview.setOnClickListener {
            b.cardMapStationPreview.visibility = View.GONE
        }
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

    override fun onResume() {
        super.onResume()
        _binding?.mapViewStations?.onResume()
    }

    override fun onPause() {
        _binding?.mapViewStations?.onPause()
        super.onPause()
    }

    override fun onDestroyView() {
        _binding?.mapViewStations?.onDetach()
        super.onDestroyView()
        _binding = null
    }
}