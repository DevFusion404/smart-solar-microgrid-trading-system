package com.smartsolar.mobile.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.PendingReservation
import com.smartsolar.mobile.databinding.ItemOperatorBookingBinding
import com.smartsolar.mobile.utils.TransferFormat

/**
 * The groups a grid operator filters reservations by. The API's "Reviewing" and
 * "Pending" both mean the reservation is still waiting for a decision.
 */
enum class BookingStatus {
    PENDING, APPROVED, COMPLETED, CANCELLED, OTHER;

    companion object {
        fun of(reservation: PendingReservation): BookingStatus = when {
            reservation.isPending -> PENDING
            reservation.status.equals("Approved", ignoreCase = true) -> APPROVED
            reservation.status.equals("Completed", ignoreCase = true) -> COMPLETED
            reservation.status.equals("Cancelled", ignoreCase = true) -> CANCELLED
            else -> OTHER
        }
    }
}

/**
 * Read-only list of the reservations placed on a grid operator's assigned nodes
 * (Bookings & Reservations screen).
 */
class OperatorBookingAdapter :
    ListAdapter<PendingReservation, OperatorBookingAdapter.BookingViewHolder>(BookingDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BookingViewHolder {
        val binding = ItemOperatorBookingBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return BookingViewHolder(binding)
    }

    override fun onBindViewHolder(holder: BookingViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class BookingViewHolder(
        private val binding: ItemOperatorBookingBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(reservation: PendingReservation) {
            binding.tvBookingProsumerName.text = reservation.prosumerName
                .ifBlank { reservation.prosumerNic ?: reservation.userId }
                .ifBlank { "Prosumer" }
            binding.tvBookingReservationId.text = reservation.reservationId
            binding.tvBookingNodeName.text = reservation.stationName.ifBlank { reservation.stationId }
            binding.tvBookingDate.text = TransferFormat.date(reservation.slotDate)
            binding.tvBookingSlot.text = reservation.slotWindow
            binding.tvBookingEnergy.text = TransferFormat.energy(reservation.reservedCapacity)

            val meta = mutableListOf<String>()
            reservation.prosumerNic?.takeIf { it.isNotBlank() }?.let { meta.add("NIC $it") }
            if (reservation.createdAt.isNotBlank()) {
                meta.add("Booked ${TransferFormat.dateTime(reservation.createdAt)}")
            }
            binding.tvBookingMeta.text = meta.joinToString("  ·  ")

            bindStatus(reservation)
        }

        // Status pill: label plus the same badge colours the rest of the app uses
        private fun bindStatus(reservation: PendingReservation) {
            val (label, bgColor, textColor) = when (BookingStatus.of(reservation)) {
                BookingStatus.PENDING ->
                    Triple("Pending", R.color.badge_bg_amber, R.color.badge_text_amber)
                BookingStatus.APPROVED ->
                    Triple("Approved", R.color.badge_bg_green, R.color.badge_text_green)
                BookingStatus.COMPLETED ->
                    Triple("Completed", R.color.reservation_blue_tint, R.color.reservation_blue)
                BookingStatus.CANCELLED ->
                    Triple("Cancelled", R.color.badge_bg_red, R.color.badge_text_red)
                BookingStatus.OTHER ->
                    Triple(reservation.status.ifBlank { "Unknown" }, R.color.badge_bg_slate, R.color.badge_text_slate)
            }
            val context = binding.root.context
            binding.tvBookingStatus.text = label
            binding.tvBookingStatus.backgroundTintList = ContextCompat.getColorStateList(context, bgColor)
            binding.tvBookingStatus.setTextColor(ContextCompat.getColor(context, textColor))
        }
    }

    class BookingDiffCallback : DiffUtil.ItemCallback<PendingReservation>() {
        override fun areItemsTheSame(oldItem: PendingReservation, newItem: PendingReservation): Boolean =
            oldItem.reservationId == newItem.reservationId

        override fun areContentsTheSame(oldItem: PendingReservation, newItem: PendingReservation): Boolean =
            oldItem == newItem
    }
}
