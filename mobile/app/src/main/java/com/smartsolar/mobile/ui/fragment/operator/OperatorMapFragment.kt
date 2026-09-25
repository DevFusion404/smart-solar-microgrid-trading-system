package com.smartsolar.mobile.ui.fragment.operator

import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.local.SessionManager
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.databinding.FragmentOperatorMapBinding
import com.smartsolar.mobile.ui.activity.GridOperatorActivity
import kotlinx.coroutines.launch
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.BoundingBox
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.overlay.Marker

class OperatorMapFragment : Fragment(R.layout.fragment_operator_map) {

    private var _binding: FragmentOperatorMapBinding? = null
    private val binding get() = _binding!!

    private var operatorId: String = ""
    private var assignedStations: List<Station> = emptyList()
    private var selectedStation: Station? = null

    // User Location Tracking
    private var userLocationMarker: Marker? = null
    private var currentUserLocation: Location? = null
    private var locationManager: LocationManager? = null

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            currentUserLocation = location
            updateUserLocationMarker(location)
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

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentOperatorMapBinding.bind(view)

        val ctx = requireContext()
        Configuration.getInstance().load(ctx, ctx.getSharedPreferences("osmdroid_operator", Context.MODE_PRIVATE))
        Configuration.getInstance().userAgentValue = ctx.packageName

        operatorId = activity?.intent?.getStringExtra("OPERATOR_ID")
            ?: SessionManager.getUsername(ctx)
            ?: ""

        setupOsmMap()
        setupListeners()
        loadAssignedNodes()
    }

    private fun setupOsmMap() {
        val mapView = binding.mapViewOperatorNodes
        mapView.setTileSource(TileSourceFactory.MAPNIK)
        mapView.setMultiTouchControls(true)
        mapView.controller.setZoom(10.0)

        // Default to Colombo center
        val defaultPoint = GeoPoint(6.9271, 79.8612)
        mapView.controller.setCenter(defaultPoint)
    }

    private fun setupListeners() {
        binding.btnRefreshMap.setOnClickListener {
            loadAssignedNodes()
        }

        binding.fabMyLocation.setOnClickListener {
            checkAndRequestLocation()
        }

        binding.btnClosePreview.setOnClickListener {
            binding.cardMapNodePreview.visibility = View.GONE
            selectedStation = null
        }

        binding.btnPreviewNodeDetails.setOnClickListener {
            val station = selectedStation ?: return@setOnClickListener
            val dialog = OperatorNodeDetailDialogFragment.newInstance(station)
            dialog.onStationUpdated = {
                loadAssignedNodes()
            }
            dialog.show(parentFragmentManager, "OperatorNodeDetail")
        }

        binding.btnPreviewManageSlots.setOnClickListener {
            val station = selectedStation ?: return@setOnClickListener
            (activity as? GridOperatorActivity)?.let { opActivity ->
                opActivity.preselectedStationId = station.stationId
                opActivity.navigateToTab(R.id.nav_grid_slots)
            }
        }
    }

    private fun loadAssignedNodes() {
        binding.pbMapLoading.visibility = View.VISIBLE
        binding.cardMapNodePreview.visibility = View.GONE
        selectedStation = null

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
                        }.ifEmpty { allResp.body()!!.take(3) }
                    }
                }
            } catch (e: Exception) {
                val dbHelper = com.smartsolar.mobile.data.local.DatabaseHelper(requireContext())
                assignedStations = dbHelper.getAllStations()
            } finally {
                binding.pbMapLoading.visibility = View.GONE
            }

            binding.tvOperatorMapSummary.text = "Showing ${assignedStations.size} assigned node(s)"
            updateMapMarkers(assignedStations)
        }
    }

    private fun updateMapMarkers(stations: List<Station>) {
        val mapView = _binding?.mapViewOperatorNodes ?: return
        mapView.overlays.clear()

        currentUserLocation?.let { loc ->
            updateUserLocationMarker(loc)
        }

        val validStations = stations.filter { it.latitude != 0.0 || it.longitude != 0.0 }

        if (validStations.isEmpty()) {
            binding.layoutEmptyMap.visibility = if (stations.isEmpty()) View.VISIBLE else View.GONE
            binding.tvMapHint.text = "No node coordinates available"
            binding.cardMapNodePreview.visibility = View.GONE
            mapView.invalidate()
            return
        }

        binding.layoutEmptyMap.visibility = View.GONE
        binding.tvMapHint.text = "Showing ${validStations.size} node(s) • Tap marker to manage slots"

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
                    showNodePreview(station)
                    mapView.controller.animateTo(point)
                    true
                }
            }
            mapView.overlays.add(marker)
        }

        mapView.invalidate()

        if (validStations.size == 1) {
            val single = GeoPoint(validStations.first().latitude, validStations.first().longitude)
            mapView.controller.setZoom(14.0)
            mapView.controller.animateTo(single)
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

    private fun showNodePreview(station: Station) {
        selectedStation = station
        val b = _binding ?: return
        b.cardMapNodePreview.visibility = View.VISIBLE
        b.tvPreviewNodeName.text = station.stationName
        b.tvPreviewNodeCode.text = "Node ID: ${station.stationId}"
        b.tvPreviewAddress.text = station.address.ifBlank { "Coordinates: ${station.latitude}, ${station.longitude}" }
        b.tvPreviewCapacity.text = "⚡ ${station.energyCapacity} kW Capacity"
        b.tvPreviewBattery.text = "🔋 ${station.batteryStorageCapacity} kWh Battery"

        val isActive = station.status.equals("Active", ignoreCase = true)
        b.tvPreviewStatusBadge.text = station.status.uppercase()
        b.tvPreviewStatusBadge.setBackgroundResource(
            if (isActive) R.drawable.bg_reservation_status_available else R.drawable.bg_reservation_status_completed
        )
        b.tvPreviewStatusBadge.setTextColor(
            ContextCompat.getColor(requireContext(), if (isActive) R.color.status_green else R.color.slate_500)
        )
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
                if (animateToUser) {
                    val userPoint = GeoPoint(loc.latitude, loc.longitude)
                    binding.mapViewOperatorNodes.controller.setZoom(15.0)
                    binding.mapViewOperatorNodes.controller.animateTo(userPoint)
                }
            }
        } catch (_: SecurityException) {}
    }

    private fun updateUserLocationMarker(location: Location) {
        val mapView = _binding?.mapViewOperatorNodes ?: return
        val userPoint = GeoPoint(location.latitude, location.longitude)

        if (userLocationMarker == null) {
            val userPin = ContextCompat.getDrawable(requireContext(), R.drawable.ic_my_location_marker)
            userLocationMarker = Marker(mapView).apply {
                position = userPoint
                title = "My Current Location"
                snippet = "Operator location"
                icon = userPin
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
            }
            mapView.overlays.add(userLocationMarker)
        } else {
            userLocationMarker?.position = userPoint
        }
        mapView.invalidate()
    }

    override fun onResume() {
        super.onResume()
        _binding?.mapViewOperatorNodes?.onResume()
    }

    override fun onPause() {
        super.onPause()
        _binding?.mapViewOperatorNodes?.onPause()
        try {
            locationManager?.removeUpdates(locationListener)
        } catch (_: Exception) {}
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding?.mapViewOperatorNodes?.onDetach()
        _binding = null
    }
}
