package com.smartsolar.mobile.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.smartsolar.mobile.data.model.EnergySlot
import com.smartsolar.mobile.databinding.ReservationItemSlotBinding

class EnergySlotAdapter(
    initialSlots: List<EnergySlot>,
    private val onReserve: (EnergySlot) -> Unit,
) : RecyclerView.Adapter<EnergySlotAdapter.SlotViewHolder>() {

    private var slots = initialSlots.toList()

    fun submitSlots(newSlots: List<EnergySlot>) {
        val oldSlots = slots
        val nextSlots = newSlots.toList()
        val diff = DiffUtil.calculateDiff(object : DiffUtil.Callback() {
            override fun getOldListSize() = oldSlots.size
            override fun getNewListSize() = nextSlots.size

            override fun areItemsTheSame(oldItemPosition: Int, newItemPosition: Int) =
                oldSlots[oldItemPosition].slotId == nextSlots[newItemPosition].slotId

            override fun areContentsTheSame(oldItemPosition: Int, newItemPosition: Int) =
                oldSlots[oldItemPosition] == nextSlots[newItemPosition]
        })

        slots = nextSlots
        diff.dispatchUpdatesTo(this)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SlotViewHolder {
        val binding = ReservationItemSlotBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return SlotViewHolder(binding)
    }

    override fun onBindViewHolder(holder: SlotViewHolder, position: Int) = holder.bind(slots[position])

    override fun getItemCount() = slots.size

    inner class SlotViewHolder(private val binding: ReservationItemSlotBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(slot: EnergySlot) {
            val total = slot.totalCapacity.coerceAtLeast(1.0)
            val availabilityPercent = ((slot.availableCapacity / total) * 100).toInt().coerceIn(0, 100)
            val isAvailable = slot.availableCapacity > 0.0 && slot.status.equals("Available", ignoreCase = true)

            binding.tvSlotTime.text = "${slot.startTime} - ${slot.endTime}"
            binding.tvSlotReference.text = "Slot ${slot.slotId}"
            binding.tvSlotCapacity.text = "${slot.availableCapacity.toInt()} / ${slot.totalCapacity.toInt()} kWh"
            binding.progressSlotCapacity.setProgressCompat(availabilityPercent, true)
            binding.tvSlotAvailability.text = if (isAvailable) "Available" else "Booked"
            binding.btnReserveEnergySlot.isEnabled = isAvailable
            binding.btnReserveEnergySlot.alpha = if (isAvailable) 1f else 0.5f
            binding.btnReserveEnergySlot.setOnClickListener { if (isAvailable) onReserve(slot) }
            itemView.setOnClickListener { if (isAvailable) onReserve(slot) }
        }
    }
}
