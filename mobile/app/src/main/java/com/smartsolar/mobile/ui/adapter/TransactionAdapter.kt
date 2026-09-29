package com.smartsolar.mobile.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.smartsolar.mobile.data.model.TransactionResponse
import com.smartsolar.mobile.databinding.ItemTransactionBinding
import com.smartsolar.mobile.utils.TransferFormat

/**
 * Component 4 - renders one energy transfer row. Shared by the prosumer
 * current / pending / history / search screens and the operator queue.
 */
class TransactionAdapter(
    initialTransactions: List<TransactionResponse> = emptyList(),
    private val onTransactionClick: (TransactionResponse) -> Unit = {},
) : RecyclerView.Adapter<TransactionAdapter.TransactionViewHolder>() {

    private var transactions = initialTransactions.toList()

    fun submitTransactions(newTransactions: List<TransactionResponse>) {
        val oldTransactions = transactions
        val nextTransactions = newTransactions.toList()
        val diff = DiffUtil.calculateDiff(object : DiffUtil.Callback() {
            override fun getOldListSize() = oldTransactions.size
            override fun getNewListSize() = nextTransactions.size

            override fun areItemsTheSame(oldItemPosition: Int, newItemPosition: Int) =
                oldTransactions[oldItemPosition].transactionId ==
                    nextTransactions[newItemPosition].transactionId

            override fun areContentsTheSame(oldItemPosition: Int, newItemPosition: Int) =
                oldTransactions[oldItemPosition] == nextTransactions[newItemPosition]
        })

        transactions = nextTransactions
        diff.dispatchUpdatesTo(this)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TransactionViewHolder {
        val binding = ItemTransactionBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return TransactionViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TransactionViewHolder, position: Int) =
        holder.bind(transactions[position])

    override fun getItemCount() = transactions.size

    inner class TransactionViewHolder(
        private val binding: ItemTransactionBinding,
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(transaction: TransactionResponse) {
            binding.tvStationName.text =
                transaction.stationName?.takeIf { it.isNotBlank() } ?: transaction.stationId
            binding.tvTransactionId.text = transaction.transactionId
            binding.tvSlotDate.text = TransferFormat.date(transaction.slotDate)
            binding.tvSlotTime.text = transaction.slotTime
            binding.tvEnergyAmount.text = TransferFormat.energy(transaction.energyAmount)
            binding.tvBookingId.text = "Booking: ${transaction.reservationId}"
            binding.badgeStatus.setStatus(transaction.transferStatus)

            binding.cardTransaction.setOnClickListener { onTransactionClick(transaction) }
        }
    }
}
