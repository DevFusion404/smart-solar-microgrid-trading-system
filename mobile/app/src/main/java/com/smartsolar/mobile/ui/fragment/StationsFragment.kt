/*
 * =====================================================
 * Project     : Smart Solar Microgrid Trading System
 * File        : StationsFragment.kt
 * Description : Prosumer station list and map. Stations are ordered nearest
 *               first using distances calculated by the API
 *               (GET /api/stations/nearby with the phone's location, or
 *               /api/stations/nearby/me with the saved home location).
 *               Search, status filters and the map work as before.
 * =====================================================
 */

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
import com.smartsolar.mobile.data.api.ApiException
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.data.repository.NearbyOrigin
import com.smartsolar.mobile.data.repository.StationRepository
import com.smartsolar.mobile.utils.LocationHelper
import com.google.android.material.snackbar.Snackbar
import com.smartsolar.mobile.databinding.FragmentStationsBinding
import com.smartsolar.mobile.ui.adapter.StationAdapter
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import androidx.activity.result.contract.ActivityResultContracts
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
    private var searchJob: Job? = null

    // User Location Tracking
    private var userLocationMarker: Marker? = null
    private var currentUserLocation: Location? = null
    private var locationManager: LocationManager? = null

    // ── Nearest-station state (distances come from GET /api/stations/nearby) ──
    private var distanceByStationKey: Map<String, Double> = emptyMap()
    private var nearbyOrigin: NearbyOrigin? = null
    private var nearbyHint: String? = null
    private var lastNearbyLocation: Location? = null
    private var nearbyJob: Job? = null
    private var reopenLookupAfterSettings = false

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            currentUserLocation = location
            updateUserLocationMarker(location)
            maybeRefreshNearby(location)
        }
        @Deprecated("Deprecated in Java")
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {}
    }

    private val requestLocationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[android.Manifest.permission.ACCESS_FINE_LOCATION] == true
        val coarseGranted = permissions[android.Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (fineGranted || coarseGranted) {
            startLocationUpdates(animateToUser = true)
        } else {
            Toast.makeText(context, "Location permission denied. Cannot locate on map.", Toast.LENGTH_SHORT).show()
        }
    }

    // Permission request made when the screen opens, to rank stations by distance.
    // Whatever the answer, the lookup continues (denied -> falls back to the saved home location).
    private val nearestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        loadNearestStations()
    }

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
        startNearestStationLookup()
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
            loadNearestStations()
        }

        binding.fabMyLocation.setOnClickListener {
            checkAndRequestLocation()
        }
    }

    private fun checkAndRequestLocation() {
        val fineGranted = ContextCompat.checkSelfPermission(
            requireContext(),
            android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        val coarseGranted = ContextCompat.checkSelfPermission(
            requireContext(),
            android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED

        if (fineGranted || coarseGranted) {
            startLocationUpdates(animateToUser = true)
        } else {
            requestLocationPermissionLauncher.launch(
                arrayOf(
                    android.Manifest.permission.ACCESS_FINE_LOCATION,
                    android.Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    private fun startLocationUpdates(animateToUser: Boolean) {
        val ctx = context ?: return
        if (locationManager == null) {
            locationManager = ctx.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        }
        val lm = locationManager ?: return

        try {
            val fineGranted = ContextCompat.checkSelfPermission(ctx, android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED
            val coarseGranted = ContextCompat.checkSelfPermission(ctx, android.Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED

            if (!fineGranted && !coarseGranted) return

            var bestLastLocation: Location? = null
            if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 3000L, 5f, locationListener)
                bestLastLocation = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            }
            if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                lm.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 3000L, 5f, locationListener)
                val netLoc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                if (bestLastLocation == null || (netLoc != null && netLoc.time > bestLastLocation.time)) {
                    bestLastLocation = netLoc
                }
            }

            bestLastLocation?.let { loc ->
                currentUserLocation = loc
                updateUserLocationMarker(loc)
                maybeRefreshNearby(loc)
                if (animateToUser && isMapViewActive) {
                    val userPoint = GeoPoint(loc.latitude, loc.longitude)
                    binding.mapViewStations.controller.setZoom(15.0)
                    binding.mapViewStations.controller.animateTo(userPoint)
                }
            }
        } catch (e: SecurityException) {
            // Permission revoked
        }
    }

    private fun updateUserLocationMarker(location: Location) {
        val mapView = _binding?.mapViewStations ?: return
        val userPoint = GeoPoint(location.latitude, location.longitude)

        if (userLocationMarker == null) {
            val userPin = ContextCompat.getDrawable(requireContext(), R.drawable.ic_my_location_marker)
            userLocationMarker = Marker(mapView).apply {
                position = userPoint
                title = "My Current Location"
                snippet = "You are here"
                icon = userPin
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                setOnMarkerClickListener { _, _ ->
                    Toast.makeText(requireContext(), "📍 You are here", Toast.LENGTH_SHORT).show()
                    true
                }
            }
        } else {
            userLocationMarker?.position = userPoint
        }

        if (userLocationMarker != null && !mapView.overlays.contains(userLocationMarker)) {
            mapView.overlays.add(userLocationMarker)
        }
        mapView.invalidate()
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
        searchJob?.cancel()
        searchJob = lifecycleScope.launch {
            // Short debounce for query changes
            if (currentSearchQuery.isNotBlank()) {
                delay(250)
            }

            val queryLocation = currentSearchQuery.ifBlank { null }
            val available = when (currentStatusFilter) {
                "ACTIVE" -> true
                "DEACTIVATED" -> false
                else -> null
            }

            val result = stationRepository.searchStations(queryLocation, available)
            if (result.isSuccess) {
                filteredStations = result.getOrNull() ?: emptyList()
            } else {
                // Fallback to local filter if remote search throws error
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
            }

            // Attach API distances and put the nearest stations first (search/filter results are kept)
            filteredStations = withDistances(filteredStations)
            stationAdapter.submitStations(filteredStations)

            val activeCount = filteredStations.count { it.status.equals("Active", ignoreCase = true) }
            val summary = "Showing ${filteredStations.size} stations ($activeCount active)"
            val origin = nearbyOrigin
            val hint = nearbyHint
            binding.tvStationsSummary.text = when {
                origin != null -> "$summary • nearest first from ${origin.label}"
                hint != null -> "$summary\n$hint"
                else -> summary
            }

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
    }

    private fun updateMapMarkers(stations: List<Station>) {
        val mapView = _binding?.mapViewStations ?: return
        mapView.overlays.clear()

        // Re-attach user location beacon if available
        currentUserLocation?.let { loc ->
            updateUserLocationMarker(loc)
        }

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
        val previewAddress = station.address.ifBlank { "Location details available" }
        b.tvPreviewAddress.text = station.distanceKm?.let {
            "$previewAddress · ${StationAdapter.formatDistance(it)} away"
        } ?: previewAddress
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

    // ── Nearest-station lookup ──────────────────────────────────────────────────

    // Asks for location permission once per app session, then looks up the nearest stations
    private fun startNearestStationLookup() {
        val ctx = requireContext()
        if (LocationHelper.hasPermission(ctx) || askedLocationThisSession) {
            loadNearestStations()
        } else {
            askedLocationThisSession = true
            nearestPermissionLauncher.launch(LocationHelper.PERMISSIONS)
        }
    }

    // Gets the phone's location once (if allowed and switched on), then asks the API for the
    // nearest stations. Without a live location the API uses the prosumer's saved home location.
    private fun loadNearestStations() {
        if (_binding == null) return
        nearbyJob?.cancel()
        nearbyJob = viewLifecycleOwner.lifecycleScope.launch {
            val ctx = context ?: return@launch
            val outcome = LocationHelper.getCurrentLocation(ctx, timeoutMs = 8_000)
            val liveLocation = (outcome as? LocationHelper.Outcome.Found)?.location

            if (liveLocation != null) {
                currentUserLocation = liveLocation
                updateUserLocationMarker(liveLocation)
            } else if (outcome == LocationHelper.Outcome.LocationOff) {
                offerToTurnOnLocation()
            }

            fetchNearest(liveLocation)
        }
    }

    // Re-ranks when the user has moved more than 500 m since the last lookup (or on the first fix)
    private fun maybeRefreshNearby(location: Location) {
        if (_binding == null) return
        val last = lastNearbyLocation
        if (nearbyOrigin == NearbyOrigin.CURRENT_LOCATION && last != null && last.distanceTo(location) < 500f) return
        nearbyJob?.cancel()
        nearbyJob = viewLifecycleOwner.lifecycleScope.launch { fetchNearest(location) }
    }

    // Calls the API and stores each station's distance, then re-applies search and filters
    private suspend fun fetchNearest(liveLocation: Location?) {
        val result = stationRepository.findNearestStations(liveLocation)
        if (_binding == null) return

        result.onSuccess { nearby ->
            distanceByStationKey = nearby.stations
                .mapNotNull { s -> s.distanceKm?.let { stationKey(s) to it } }
                .toMap()
            nearbyOrigin = nearby.origin
            nearbyHint = null
            lastNearbyLocation = liveLocation
        }.onFailure { error ->
            distanceByStationKey = emptyMap()
            nearbyOrigin = null
            nearbyHint = if ((error as? ApiException)?.errorCode == StationRepository.HOME_LOCATION_NOT_SET) {
                "Turn on location, or set your home location in Profile, to see the nearest stations first."
            } else {
                "Nearest-station sorting is unavailable right now."
            }
        }

        applyFilters()
    }

    // Adds the API distance to each station and sorts nearest first.
    // Stations without a distance (e.g. deactivated ones) keep their order at the end.
    private fun withDistances(stations: List<Station>): List<Station> {
        if (distanceByStationKey.isEmpty()) return stations
        return stations
            .map { station -> station.copy(distanceKm = distanceByStationKey[stationKey(station)]) }
            .sortedWith(compareBy(nullsLast<Double>()) { it.distanceKm })
    }

    // Stable key used to match stations from different API responses
    private fun stationKey(station: Station): String = station.stationId.ifBlank { station.id ?: "" }

    // Shows a prompt with a shortcut to the location settings screen
    private fun offerToTurnOnLocation() {
        val b = _binding ?: return
        Snackbar.make(b.root, "Location is off. Turn it on to see stations nearest to you.", Snackbar.LENGTH_LONG)
            .setAction("Turn on") {
                reopenLookupAfterSettings = true
                LocationHelper.openLocationSettings(requireContext())
            }
            .show()
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
        // User came back from the location settings screen: try the live location again
        if (reopenLookupAfterSettings) {
            reopenLookupAfterSettings = false
            loadNearestStations()
        }
    }

    override fun onPause() {
        locationManager?.removeUpdates(locationListener)
        _binding?.mapViewStations?.onPause()
        super.onPause()
    }

    override fun onDestroyView() {
        nearbyJob?.cancel()
        locationManager?.removeUpdates(locationListener)
        userLocationMarker = null
        _binding?.mapViewStations?.onDetach()
        super.onDestroyView()
        _binding = null
    }

    companion object {
        // The permission dialog is shown at most once per app session (not every time the tab opens)
        private var askedLocationThisSession = false
    }
}