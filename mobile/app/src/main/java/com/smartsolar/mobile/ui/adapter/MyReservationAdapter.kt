package com.smartsolar.mobile.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.smartsolar.mobile.databinding.ReservationItemMyReservationBinding
import com.smartsolar.mobile.ui.fragment.ReservationUi

class MyReservationAdapter(
    initialReservations: List<ReservationUi>,
    private val onDetails: (ReservationUi) -> Unit,
) : RecyclerView.Adapter<MyReservationAdapter.ReservationViewHolder>() {

    private var reservations = initialReservations.toList()

    fun submitReservations(newReservations: List<ReservationUi>) {
        val oldReservations = reservations
        val nextReservations = newReservations.toList()
        val diff = DiffUtil.calculateDiff(object : DiffUtil.Callback() {
            override fun getOldListSize() = oldReservations.size
            override fun getNewListSize() = nextReservations.size

            override fun areItemsTheSame(oldItemPosition: Int, newItemPosition: Int) =
                oldReservations[oldItemPosition].id == nextReservations[newItemPosition].id

            override fun areContentsTheSame(oldItemPosition: Int, newItemPosition: Int) =
                oldReservations[oldItemPosition] == nextReservations[newItemPosition]
        })

        reservations = nextReservations
        diff.dispatchUpdatesTo(this)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReservationViewHolder {
        val binding = ReservationItemMyReservationBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ReservationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ReservationViewHolder, position: Int) = holder.bind(reservations[position])

    override fun getItemCount() = reservations.size

    inner class ReservationViewHolder(private val binding: ReservationItemMyReservationBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(reservation: ReservationUi) {
            binding.tvReservationStation.text = reservation.station
            binding.tvReservationReference.text = "Reservation ${reservation.id}"
            binding.tvReservationStatus.text = reservation.status
            binding.tvReservationSchedule.text = "${reservation.date}, ${reservation.time}"
            binding.tvReservationEnergy.text = reservation.energy
            binding.btnViewReservationDetails.setOnClickListener { onDetails(reservation) }
            itemView.setOnClickListener { onDetails(reservation) }
        }
    }
}
