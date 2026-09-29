package com.smartsolar.mobile.ui.activity.transfer

import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.TransactionResponse

/**
 * Component 4 - booking history, meaning transfers whose energy has been handed over.
 *
 * Backed by GET /api/transactions/my?status=Completed. The list rendering,
 * empty state and offline cache come from [BaseTransactionListActivity].
 */
class BookingHistoryActivity : BaseTransactionListActivity() {

    override val layoutResId = R.layout.activity_booking_history

    override val screenTitleRes = R.string.transfer_title_history

    override val emptyMessageRes = R.string.transfer_empty_bookings

    override suspend fun fetchTransactions(): Result<List<TransactionResponse>> =
        repository.getMyTransactions(status = "Completed")
}
