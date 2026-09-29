package com.smartsolar.mobile.ui.activity.transfer

import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.TransactionResponse

/**
 * Component 4 - current bookings, meaning transfers a grid operator has already scanned and verified but not yet completed.
 *
 * Backed by GET /api/transactions/my?status=Verified. The list rendering,
 * empty state and offline cache come from [BaseTransactionListActivity].
 */
class CurrentBookingActivity : BaseTransactionListActivity() {

    override val layoutResId = R.layout.activity_current_booking

    override val screenTitleRes = R.string.transfer_title_current

    override val emptyMessageRes = R.string.transfer_empty_bookings

    override suspend fun fetchTransactions(): Result<List<TransactionResponse>> =
        repository.getMyTransactions(status = "Verified")
}
