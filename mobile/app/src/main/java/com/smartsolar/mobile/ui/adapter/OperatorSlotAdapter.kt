package com.smartsolar.mobile.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.smartsolar.mobile.data.model.EnergySlot
import com.smartsolar.mobile.databinding.ItemOperatorSlotBinding

class OperatorSlotAdapter(
    private val onUpdateAvailabilityClicked: (EnergySlot) -> Unit
) : ListAdapter<EnergySlot, OperatorSlotAdapter.SlotViewHolder>(SlotDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SlotViewHolder {
        val binding = ItemOperatorSlotBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return SlotViewHolder(binding)
    }

    override fun onBindViewHolder(holder: SlotViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class SlotViewHolder(
        private val binding: ItemOperatorSlotBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(slot: EnergySlot) {
            binding.tvOperatorSlotId.text = slot.slotId.ifBlank { "SLOT" }
            binding.tvOperatorSlotTime.text = "${slot.startTime} - ${slot.endTime}"
            binding.tvOperatorSlotDate.text = slot.date
            binding.tvOperatorSlotStatus.text = slot.status.uppercase()

            val total = slot.totalCapacity
            val available = slot.availableCapacity
            binding.tvOperatorSlotCapacityRatio.text = "${available} / ${total} kWh"

            // Utilization progress
            val utilizationPercent = if (total > 0) {
                (((total - available) / total) * 100).toInt().coerceIn(0, 100)
            } else {
                0
            }
            binding.pbSlotUtilization.progress = utilizationPercent

            binding.btnUpdateSlotCapacity.setOnClickListener {
                onUpdateAvailabilityClicked(slot)
            }
        }
    }

    class SlotDiffCallback : DiffUtil.ItemCallback<EnergySlot>() {
        override fun areItemsTheSame(oldItem: EnergySlot, newItem: EnergySlot): Boolean =
            (oldItem.id != null && oldItem.id == newItem.id) || oldItem.slotId == newItem.slotId

        override fun areContentsTheSame(oldItem: EnergySlot, newItem: EnergySlot): Boolean =
            oldItem == newItem
    }
}
