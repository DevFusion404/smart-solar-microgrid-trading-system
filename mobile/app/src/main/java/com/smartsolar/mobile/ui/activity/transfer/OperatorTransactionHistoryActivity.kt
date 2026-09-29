package com.smartsolar.mobile.ui.activity.transfer

import android.content.Intent
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.TransactionResponse

/**
 * Component 4 - every transfer the operator can see, newest first.
 *
 * Uses GET /api/transactions/search, which is restricted to Backoffice and
 * GridOperator roles - exactly the audience of this screen. Tapping a row opens
 * the verification view so a queued transfer can be actioned from history.
 */
class OperatorTransactionHistoryActivity : BaseTransactionListActivity() {

    override val layoutResId = R.layout.activity_operator_transaction_history

    override val screenTitleRes = R.string.transfer_btn_transaction_history

    /** Operator history is server-wide, so a per-device cache would mislead. */
    override val useOfflineCache = false

    override suspend fun fetchTransactions(): Result<List<TransactionResponse>> =
        repository.searchTransactions(pageSize = 50).map { it.items }

    override fun onTransactionSelected(transaction: TransactionResponse) {
        startActivity(
            Intent(this, QRVerificationActivity::class.java)
                .putExtra(QRVerificationActivity.EXTRA_TRANSACTION_ID, transaction.transactionId)
        )
    }
}
