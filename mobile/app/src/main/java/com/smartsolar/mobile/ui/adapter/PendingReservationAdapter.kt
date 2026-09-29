package com.smartsolar.mobile.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.smartsolar.mobile.data.model.PendingReservation
import com.smartsolar.mobile.databinding.ItemPendingReservationBinding
import com.smartsolar.mobile.utils.TransferFormat

/**
 * Component 4 - the grid operator approval queue.
 *
 * Approving is what mints the reservation QR pass on the server, so the row
 * needs no separate "generate QR" action.
 */
class PendingReservationAdapter(
    initialReservations: List<PendingReservation> = emptyList(),
    private val onApprove: (PendingReservation) -> Unit,
    private val onDecline: (PendingReservation) -> Unit,
) : RecyclerView.Adapter<PendingReservationAdapter.ReservationViewHolder>() {

    private var reservations = initialReservations.toList()

    fun submitReservations(newReservations: List<PendingReservation>) {
        val oldReservations = reservations
        val nextReservations = newReservations.toList()
        val diff = DiffUtil.calculateDiff(object : DiffUtil.Callback() {
            override fun getOldListSize() = oldReservations.size
            override fun getNewListSize() = nextReservations.size

            override fun areItemsTheSame(oldItemPosition: Int, newItemPosition: Int) =
                oldReservations[oldItemPosition].reservationId ==
                    nextReservations[newItemPosition].reservationId

            override fun areContentsTheSame(oldItemPosition: Int, newItemPosition: Int) =
                oldReservations[oldItemPosition] == nextReservations[newItemPosition]
        })

        reservations = nextReservations
        diff.dispatchUpdatesTo(this)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReservationViewHolder {
        val binding = ItemPendingReservationBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ReservationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ReservationViewHolder, position: Int) =
        holder.bind(reservations[position])

    override fun getItemCount() = reservations.size

    inner class ReservationViewHolder(
        private val binding: ItemPendingReservationBinding,
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(reservation: PendingReservation) {
            binding.tvProsumerName.text = reservation.prosumerName
                .ifBlank { reservation.prosumerNic ?: reservation.userId }
            binding.tvReservationId.text = reservation.reservationId
            binding.tvStationName.text =
                reservation.stationName.ifBlank { reservation.stationId }
            binding.tvSlotDate.text = TransferFormat.date(reservation.slotDate)
            binding.tvSlotTime.text = reservation.slotWindow
            binding.tvEnergyAmount.text = TransferFormat.energy(reservation.reservedCapacity)
            binding.badgeStatus.setStatus(reservation.status)

            binding.btnApprove.setOnClickListener { onApprove(reservation) }
            binding.btnDecline.setOnClickListener { onDecline(reservation) }
        }
    }
}
