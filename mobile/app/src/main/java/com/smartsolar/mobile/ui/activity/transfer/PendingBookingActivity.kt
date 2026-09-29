package com.smartsolar.mobile.ui.activity.transfer

import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.TransactionResponse

/**
 * Component 4 - pending bookings, meaning a QR has been issued but no operator has scanned it yet.
 *
 * Backed by GET /api/transactions/my?status=Pending. The list rendering,
 * empty state and offline cache come from [BaseTransactionListActivity].
 */
class PendingBookingActivity : BaseTransactionListActivity() {

    override val layoutResId = R.layout.activity_pending_booking

    override val screenTitleRes = R.string.transfer_title_pending

    override val emptyMessageRes = R.string.transfer_empty_pending

    override suspend fun fetchTransactions(): Result<List<TransactionResponse>> =
        repository.getMyTransactions(status = "Pending")
}
