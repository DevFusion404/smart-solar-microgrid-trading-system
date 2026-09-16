package com.smartsolar.mobile.ui.adapter

import android.view.MotionEvent
import android.view.View
import android.widget.TextView
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.Station
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.infowindow.MarkerInfoWindow

class StationOsmInfoWindow(
    layoutResId: Int,
    mapView: MapView,
    private val onStationClick: (Station) -> Unit
) : MarkerInfoWindow(layoutResId, mapView) {

    override fun onOpen(item: Any?) {
        val marker = item as? Marker ?: return
        val station = marker.relatedObject as? Station ?: return
        val view = mView ?: return

        val tvName = view.findViewById<TextView>(R.id.tvInfoStationName)
        val tvStatus = view.findViewById<TextView>(R.id.tvInfoStatusBadge)
        val tvAddress = view.findViewById<TextView>(R.id.tvInfoAddress)
        val tvCapacity = view.findViewById<TextView>(R.id.tvInfoCapacity)
        val tvBattery = view.findViewById<TextView>(R.id.tvInfoBattery)
        val btnTap = view.findViewById<View>(R.id.btnTapToReserve)

        tvName?.text = station.stationName
        tvAddress?.text = station.address.ifBlank { "Location details available" }
        tvCapacity?.text = "⚡ ${station.energyCapacity} kW"
        tvBattery?.text = "🔋 ${station.batteryStorageCapacity} kWh"

        val isActive = station.status.equals("Active", ignoreCase = true)
        tvStatus?.text = if (isActive) "Active" else "Deactivated"
        tvStatus?.setBackgroundResource(
            if (isActive) R.drawable.bg_reservation_status_available
            else R.drawable.bg_reservation_status_completed
        )
        tvStatus?.setTextColor(
            view.context.getColor(
                if (isActive) R.color.reservation_green
                else R.color.slate_500
            )
        )

        val triggerAction = {
            close()
            onStationClick(station)
        }

        view.setOnClickListener { triggerAction() }
        btnTap?.setOnClickListener { triggerAction() }

        view.setOnTouchListener { _, event ->
            if (event.action == MotionEvent.ACTION_UP) {
                triggerAction()
                true
            } else {
                false
            }
        }
    }
}