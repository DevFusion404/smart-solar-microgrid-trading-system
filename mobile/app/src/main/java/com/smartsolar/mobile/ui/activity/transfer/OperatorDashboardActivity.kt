package com.smartsolar.mobile.ui.activity.transfer

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.OperatorDashboard
import com.smartsolar.mobile.data.model.TransactionResponse
import com.smartsolar.mobile.data.repository.TransactionRepository
import com.smartsolar.mobile.databinding.ActivityOperatorDashboardBinding
import com.smartsolar.mobile.ui.adapter.TransactionAdapter
import kotlinx.coroutines.launch

/**
 * Component 4 - Grid operator transfer dashboard.
 *
 * Counters and the pending queue come from GET /api/dashboard/operator.
 * Tapping a queued transfer opens it straight in the verification screen,
 * which is the same destination a successful scan reaches.
 */
class OperatorDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityOperatorDashboardBinding
    private lateinit var pendingAdapter: TransactionAdapter
    private val repository by lazy { TransactionRepository() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOperatorDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarOperator.setNavigationOnClickListener { finish() }
        binding.swipeRefreshOperator.setOnRefreshListener { loadDashboard(isRefresh = true) }

        pendingAdapter = TransactionAdapter(onTransactionClick = ::openVerification)
        binding.recyclerPendingTransfers.layoutManager = LinearLayoutManager(this)
        binding.recyclerPendingTransfers.adapter = pendingAdapter

        binding.btnScanQr.setOnClickListener {
            startActivity(Intent(this, QRScannerActivity::class.java))
        }
        binding.btnPendingReservations.setOnClickListener {
            startActivity(Intent(this, PendingReservationsActivity::class.java))
        }
        binding.btnTransactionHistory.setOnClickListener {
            startActivity(Intent(this, OperatorTransactionHistoryActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        // Completing a transfer elsewhere changes these counters.
        loadDashboard()
    }

    private fun openVerification(transaction: TransactionResponse) {
        startActivity(
            Intent(this, QRVerificationActivity::class.java)
                .putExtra(QRVerificationActivity.EXTRA_TRANSACTION_ID, transaction.transactionId)
        )
    }

    private fun loadDashboard(isRefresh: Boolean = false) {
        if (!isRefresh) binding.swipeRefreshOperator.isRefreshing = true

        lifecycleScope.launch {
            val result = repository.getOperatorDashboard()
            binding.swipeRefreshOperator.isRefreshing = false

            result.onSuccess { data ->
                render(data)
                val isEmpty = data.pendingTransfers.isEmpty()
                binding.cardEmptyState.visibility = if (isEmpty) View.VISIBLE else View.GONE
                binding.tvOperatorMessage.visibility = if (isEmpty) View.VISIBLE else View.GONE
                if (isEmpty) {
                    binding.tvOperatorMessage.text = getString(R.string.transfer_empty_pending)
                }
            }.onFailure { error ->
                binding.cardEmptyState.visibility = View.VISIBLE
                binding.tvOperatorMessage.visibility = View.VISIBLE
                binding.tvOperatorMessage.text =
                    error.message ?: getString(R.string.transfer_error_offline)
            }
        }
    }

    private fun render(data: OperatorDashboard) {
        binding.tvCountPendingTransfers.text = data.summary.pendingTransfers.toString()
        binding.tvCountToday.text = data.summary.todayTransfers.toString()
        binding.tvCountCompletedTransfers.text = data.summary.completedTransfers.toString()
        pendingAdapter.submitTransactions(data.pendingTransfers)
    }
}
