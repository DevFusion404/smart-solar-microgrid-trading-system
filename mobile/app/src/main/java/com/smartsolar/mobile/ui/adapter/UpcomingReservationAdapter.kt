package com.smartsolar.mobile.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.UpcomingReservation
import com.smartsolar.mobile.databinding.ItemUpcomingReservationBinding
import com.smartsolar.mobile.utils.TransferFormat

/**
 * Component 4 - approved reservations that are ready for a QR.
 * Only approved reservations reach this list, so the action button is always
 * enabled; when a QR already exists the label switches to "View QR Code".
 */
class UpcomingReservationAdapter(
    initialReservations: List<UpcomingReservation> = emptyList(),
    private val onGenerateQr: (UpcomingReservation) -> Unit,
) : RecyclerView.Adapter<UpcomingReservationAdapter.ReservationViewHolder>() {

    private var reservations = initialReservations.toList()

    fun submitReservations(newReservations: List<UpcomingReservation>) {
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
        val binding = ItemUpcomingReservationBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ReservationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ReservationViewHolder, position: Int) =
        holder.bind(reservations[position])

    override fun getItemCount() = reservations.size

    inner class ReservationViewHolder(
        private val binding: ItemUpcomingReservationBinding,
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(reservation: UpcomingReservation) {
            binding.tvStationName.text =
                reservation.stationName?.takeIf { it.isNotBlank() } ?: reservation.stationId
            binding.tvReservationId.text = reservation.reservationId
            binding.tvSlotDate.text = TransferFormat.date(reservation.slotDate)
            binding.tvSlotTime.text = reservation.slotTime
            binding.tvEnergyAmount.text = TransferFormat.energy(reservation.reservedCapacity)
            binding.badgeStatus.setStatus(reservation.status)

            binding.btnGenerateQr.setText(
                if (reservation.hasTransaction) R.string.transfer_view_qr
                else R.string.transfer_generate_qr
            )
            binding.btnGenerateQr.setOnClickListener { onGenerateQr(reservation) }
        }
    }
}
