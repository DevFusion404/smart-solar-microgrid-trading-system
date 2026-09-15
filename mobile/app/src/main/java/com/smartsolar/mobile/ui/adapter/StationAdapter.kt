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

    fun submitStations(newStations: List<Station>) {
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
        diff.dispatchUpdatesTo(this)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StationViewHolder {
        val binding = ItemStationBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return StationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: StationViewHolder, position: Int) {
        holder.bind(stations[position])
    }

    override fun getItemCount() = stations.size

    inner class StationViewHolder(private val binding: ItemStationBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(station: Station) {
            val context = binding.root.context
            val isActive = station.status.equals("Active", ignoreCase = true)

            binding.tvStationName.text = station.stationName.ifBlank { "Microgrid Station" }
            binding.tvStationId.text = station.stationId.ifBlank { station.id?.takeLast(6) ?: "STN" }
            binding.tvStationAddress.text = station.address.ifBlank { "Location details unavailable" }

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
