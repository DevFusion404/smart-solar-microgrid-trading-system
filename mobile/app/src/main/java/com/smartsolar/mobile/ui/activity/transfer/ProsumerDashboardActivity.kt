package com.smartsolar.mobile.ui.activity.transfer

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.ProsumerDashboard
import com.smartsolar.mobile.data.repository.TransactionRepository
import com.smartsolar.mobile.databinding.ActivityProsumerDashboardBinding
import com.smartsolar.mobile.utils.TransferFormat
import kotlinx.coroutines.launch

/**
 * Component 4 - Prosumer transfer dashboard.
 *
 * Every counter comes from GET /api/dashboard/prosumer, which resolves the
 * caller from the JWT, so no NIC has to be passed from the client. Nothing on
 * this screen is hardcoded.
 */
class ProsumerDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProsumerDashboardBinding
    private val repository by lazy { TransactionRepository() }

    /** Kept so "Show QR Code" can jump straight to the newest pending transfer. */
    private var dashboard: ProsumerDashboard? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProsumerDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarDashboard.setNavigationOnClickListener { finish() }
        binding.swipeRefresh.setOnRefreshListener { loadDashboard(isRefresh = true) }

        setupNavigation()
    }

    override fun onResume() {
        super.onResume()
        // Generating a QR on another screen changes these counters.
        loadDashboard()
    }

    private fun setupNavigation() {
        binding.btnCurrentBookings.setOnClickListener { open(CurrentBookingActivity::class.java) }
        binding.cardCurrent.setOnClickListener { open(CurrentBookingActivity::class.java) }

        binding.btnPendingBookings.setOnClickListener { open(PendingBookingActivity::class.java) }
        binding.cardPending.setOnClickListener { open(PendingBookingActivity::class.java) }

        binding.btnApprovedBookings.setOnClickListener { open(ApprovedBookingActivity::class.java) }
        binding.cardApproved.setOnClickListener { open(ApprovedBookingActivity::class.java) }

        binding.btnBookingHistory.setOnClickListener { open(BookingHistoryActivity::class.java) }
        binding.cardCompleted.setOnClickListener { open(BookingHistoryActivity::class.java) }

        binding.btnSearchBooking.setOnClickListener { open(BookingSearchActivity::class.java) }

        binding.btnShowQr.setOnClickListener { showNewestQr() }
    }

    private fun open(target: Class<*>) = startActivity(Intent(this, target))

    /**
     * Opens the QR for the most recent transfer that still has a live token.
     * With nothing pending, the prosumer is sent to the approved list to mint one.
     */
    private fun showNewestQr() {
        val pending = dashboard?.pendingTransactions.orEmpty()
        val newest = pending.firstOrNull()

        if (newest == null) {
            Toast.makeText(this, R.string.transfer_empty_pending, Toast.LENGTH_SHORT).show()
            open(ApprovedBookingActivity::class.java)
            return
        }

        startActivity(
            Intent(this, QRCodeActivity::class.java)
                .putExtra(QRCodeActivity.EXTRA_TRANSACTION_ID, newest.transactionId)
        )
    }

    private fun loadDashboard(isRefresh: Boolean = false) {
        if (!isRefresh) binding.swipeRefresh.isRefreshing = true

        lifecycleScope.launch {
            val result = repository.getMyDashboard()
            binding.swipeRefresh.isRefreshing = false

            result.onSuccess { data ->
                dashboard = data
                render(data)
                binding.tvDashboardMessage.visibility = View.GONE
            }.onFailure { error ->
                binding.tvDashboardMessage.visibility = View.VISIBLE
                binding.tvDashboardMessage.text =
                    error.message ?: getString(R.string.transfer_error_offline)
            }
        }
    }

    private fun render(data: ProsumerDashboard) {
        // Current = verified at the station, pending = QR issued but unscanned.
        binding.tvCountCurrent.text = data.currentTransactions.size.toString()
        binding.tvCountPending.text = data.pendingTransactions.size.toString()
        binding.tvCountApproved.text = data.approvedFutureReservations.size.toString()
        binding.tvCountCompleted.text = data.summary.completedTransfers.toString()

        binding.tvTotalEnergy.text = getString(R.string.transfer_total_energy) +
            ": " + TransferFormat.energy(data.summary.totalEnergyTransferred)
    }
}
