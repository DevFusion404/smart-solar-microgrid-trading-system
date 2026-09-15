package com.smartsolar.mobile.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.smartsolar.mobile.databinding.ReservationItemHistoryBinding
import com.smartsolar.mobile.ui.fragment.ReservationUi

class ReservationHistoryAdapter(
    initialReservations: List<ReservationUi>,
) : RecyclerView.Adapter<ReservationHistoryAdapter.HistoryViewHolder>() {

    private var reservations = initialReservations.toList()

    fun submitHistory(newReservations: List<ReservationUi>) {
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

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val binding = ReservationItemHistoryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return HistoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) = holder.bind(reservations[position])

    override fun getItemCount() = reservations.size

    inner class HistoryViewHolder(private val binding: ReservationItemHistoryBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(reservation: ReservationUi) {
            binding.tvHistoryStation.text = reservation.station
            binding.tvHistorySchedule.text = "${reservation.date}  |  ${reservation.time}"
            binding.tvHistoryEnergy.text = reservation.energy
            binding.tvHistoryStatus.text = reservation.status
        }
    }
}
