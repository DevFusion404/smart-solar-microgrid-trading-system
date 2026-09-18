package com.smartsolar.mobile.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.databinding.ItemOperatorNodeBinding

class OperatorNodeAdapter(
    private val onNodeDetailsClicked: (Station) -> Unit,
    private val onManageSlotsClicked: (Station) -> Unit
) : ListAdapter<Station, OperatorNodeAdapter.NodeViewHolder>(NodeDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NodeViewHolder {
        val binding = ItemOperatorNodeBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return NodeViewHolder(binding)
    }

    override fun onBindViewHolder(holder: NodeViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class NodeViewHolder(
        private val binding: ItemOperatorNodeBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(station: Station) {
            binding.tvOperatorNodeName.text = station.stationName.ifBlank { "Microgrid Node" }
            binding.tvOperatorNodeCode.text = station.stationId.ifBlank { "NODE" }
            binding.tvOperatorNodeAddress.text = station.address.ifBlank { "Lat: ${station.latitude}, Lng: ${station.longitude}" }
            binding.tvOperatorNodeStatus.text = station.status.uppercase()

            binding.tvOperatorSolarCap.text = "${station.energyCapacity} kWh"
            binding.tvOperatorBatteryCap.text = "${station.batteryStorageCapacity} kWh"
            binding.tvOperatorSchedule.text = station.operationalSchedule.ifBlank { "Standard Daily" }

            binding.btnNodeDetails.setOnClickListener {
                onNodeDetailsClicked(station)
            }

            binding.btnManageNodeSlots.setOnClickListener {
                onManageSlotsClicked(station)
            }
        }
    }

    class NodeDiffCallback : DiffUtil.ItemCallback<Station>() {
        override fun areItemsTheSame(oldItem: Station, newItem: Station): Boolean =
            (oldItem.id != null && oldItem.id == newItem.id) || oldItem.stationId == newItem.stationId

        override fun areContentsTheSame(oldItem: Station, newItem: Station): Boolean =
            oldItem == newItem
    }
}
