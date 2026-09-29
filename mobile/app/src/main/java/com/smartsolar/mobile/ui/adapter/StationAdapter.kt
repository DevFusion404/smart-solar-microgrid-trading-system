package com.smartsolar.mobile.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.databinding.ItemStationBinding

class StationAdapter(
    initialStations: List<Station> = emptyList(),
    private val onReserveEnergy: (Station) -> Unit,
    private val onStationClick: ((Station) -> Unit)? = null
) : RecyclerView.Adapter<StationAdapter.StationViewHolder>() {

    private var stations = initialStations.toList()

    // Key of the station shown with the "Nearest to you" badge (first station that has a distance)
    private var nearestKey: String? = null

    // Stable key for a station (business id, falling back to the MongoDB id)
    private fun keyOf(station: Station): String = station.stationId.ifBlank { station.id ?: "" }

    fun submitStations(newStations: List<Station>) {
        val previousNearestKey = nearestKey
        val oldStations = stations
        val nextStations = newStations.toList()
        val diff = DiffUtil.calculateDiff(object : DiffUtil.Callback() {
            override fun getOldListSize() = oldStations.size
            override fun getNewListSize() = nextStations.size

            override fun areItemsTheSame(oldItemPosition: Int, newItemPosition: Int): Boolean {
                val old = oldStations[oldItemPosition]
                val next = nextStations[newItemPosition]
                return old.stationId == next.stationId || old.id == next.id
            }

            override fun areContentsTheSame(oldItemPosition: Int, newItemPosition: Int): Boolean {
                return oldStations[oldItemPosition] == nextStations[newItemPosition]
            }
        })

        stations = nextStations
        nearestKey = nextStations.firstOrNull()?.takeIf { it.distanceKm != null }?.let(::keyOf)
        diff.dispatchUpdatesTo(this)

        // Moved cards are not re-bound by DiffUtil, so refresh the old and new "nearest" cards
        if (previousNearestKey != nearestKey) {
            listOfNotNull(previousNearestKey, nearestKey).forEach { key ->
                val position = stations.indexOfFirst { keyOf(it) == key }
                if (position >= 0) notifyItemChanged(position)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StationViewHolder {
        val binding = ItemStationBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return StationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: StationViewHolder, position: Int) {
        holder.bind(stations[position])
    }

    override fun getItemCount() = stations.size

    companion object {
        // Formats a distance as "850 m" under 1 km, otherwise "2.4 km"
        fun formatDistance(km: Double): String =
            if (km < 1) "${(km * 1000).toInt()} m" else String.format(java.util.Locale.US, "%.1f km", km)
    }

    inner class StationViewHolder(private val binding: ItemStationBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(station: Station) {
            val context = binding.root.context
            val isActive = station.status.equals("Active", ignoreCase = true)

            binding.tvStationName.text = station.stationName.ifBlank { "Microgrid Station" }
            binding.tvStationId.text = station.stationId.ifBlank { station.id?.takeLast(6) ?: "STN" }
            binding.tvStationAddress.text = station.address.ifBlank { "Location details unavailable" }

            // Distance badge: the first station in the nearest-first list gets the "Nearest" label
            val distance = station.distanceKm
            if (distance != null) {
                val isNearest = keyOf(station) == nearestKey
                binding.tvStationDistance.text =
                    if (isNearest) "⭐ Nearest to you · ${formatDistance(distance)}"
                    else "📍 ${formatDistance(distance)} away"
                binding.tvStationDistance.visibility = android.view.View.VISIBLE
            } else {
                binding.tvStationDistance.visibility = android.view.View.GONE
            }

            // Capacities
            binding.tvEnergyCapacity.text = "${station.energyCapacity.toInt()} kWh"
            binding.tvBatteryStorage.text = "${station.batteryStorageCapacity.toInt()} kWh"

            // Schedule
            binding.tvOperationalSchedule.text =
                station.operationalSchedule.ifBlank { "06:00 AM - 06:00 PM (Daily)" }

            // Status Badge
            if (isActive) {
                binding.tvStationStatus.text = "Active"
                binding.tvStationStatus.setBackgroundResource(R.drawable.bg_reservation_status_available)
                binding.tvStationStatus.setTextColor(ContextCompat.getColor(context, R.color.reservation_green))
                binding.btnReserveEnergy.isEnabled = true
                binding.btnReserveEnergy.alpha = 1.0f
            } else {
                binding.tvStationStatus.text = "Deactivated"
                binding.tvStationStatus.setBackgroundResource(R.drawable.bg_role_badge)
                binding.tvStationStatus.setTextColor(ContextCompat.getColor(context, R.color.slate_500))
                binding.btnReserveEnergy.isEnabled = false
                binding.btnReserveEnergy.alpha = 0.5f
            }

            binding.btnReserveEnergy.setOnClickListener {
                if (isActive) onReserveEnergy(station)
            }

            binding.cardStation.setOnClickListener {
                onStationClick?.invoke(station)
            }
        }
    }
}
