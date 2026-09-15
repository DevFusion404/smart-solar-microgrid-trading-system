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

            // Format time range nicely (e.g. 08:00:00 -> 08:00 AM)
            val formattedStart = formatTime(slot.startTime)
            val formattedEnd = formatTime(slot.endTime)
            binding.tvSlotTime.text = "$formattedStart - $formattedEnd"

            // Format date badge (e.g. "Slot SLOT-001 • Today" or "Slot SLOT-001 • 20 Sep")
            val dateLabel = parseLocalDate(slot.date)?.let { formatDate(it) }
            binding.tvSlotReference.text = if (!dateLabel.isNullOrBlank()) {
                "Slot ${slot.slotId} • $dateLabel"
            } else {
                "Slot ${slot.slotId}"
            }

            binding.tvSlotCapacity.text = "${slot.availableCapacity.toInt()} / ${slot.totalCapacity.toInt()} kWh"
            binding.progressSlotCapacity.setProgressCompat(availabilityPercent, true)
            binding.tvSlotAvailability.text = if (isAvailable) "Available" else "Booked"
            binding.btnReserveEnergySlot.isEnabled = isAvailable
            binding.btnReserveEnergySlot.alpha = if (isAvailable) 1f else 0.5f
            binding.btnReserveEnergySlot.setOnClickListener { if (isAvailable) onReserve(slot) }
            itemView.setOnClickListener { if (isAvailable) onReserve(slot) }
        }

        private fun formatTime(timeStr: String): String {
            val clean = timeStr.trim()
            if (clean.contains("AM", ignoreCase = true) || clean.contains("PM", ignoreCase = true)) {
                return clean
            }
            val parts = clean.split(":")
            if (parts.size >= 2) {
                val hour = parts[0].toIntOrNull() ?: return clean
                val minute = parts[1]
                val amPm = if (hour < 12) "AM" else "PM"
                val displayHour = when {
                    hour == 0 -> 12
                    hour > 12 -> hour - 12
                    else -> hour
                }
                return String.format(java.util.Locale.US, "%02d:%s %s", displayHour, minute, amPm)
            }
            return clean
        }

        private fun parseLocalDate(dateStr: String): java.time.LocalDate? {
            if (dateStr.isBlank()) return null
            return try {
                java.time.Instant.parse(dateStr)
                    .atZone(java.time.ZoneId.systemDefault())
                    .toLocalDate()
            } catch (e: Exception) {
                try {
                    java.time.LocalDate.parse(dateStr.take(10))
                } catch (e2: Exception) {
                    null
                }
            }
        }

        private fun formatDate(date: java.time.LocalDate): String {
            val now = java.time.LocalDate.now()
            return when (date) {
                now -> "Today"
                now.plusDays(1) -> "Tomorrow"
                else -> date.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM", java.util.Locale.getDefault()))
            }
        }
    }
}
