package com.smartsolar.mobile.ui.activity.transfer

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.local.DatabaseHelper
import com.smartsolar.mobile.data.model.UpcomingReservation
import com.smartsolar.mobile.data.repository.TransactionRepository
import com.smartsolar.mobile.databinding.ActivityApprovedBookingBinding
import com.smartsolar.mobile.ui.adapter.UpcomingReservationAdapter
import kotlinx.coroutines.launch

/**
 * Component 4 - approved future reservations, each with a Generate QR action.
 *
 * The list comes from the approvedFutureReservations block of
 * GET /api/dashboard/prosumer, which the backend already filters to reservations
 * that are approved and dated today or later. Generating a QR for anything else
 * is refused server side, so the client never has to guess eligibility.
 */
class ApprovedBookingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityApprovedBookingBinding
    private lateinit var adapter: UpcomingReservationAdapter
    private val repository by lazy { TransactionRepository() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityApprovedBookingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarApproved.setNavigationOnClickListener { finish() }

        adapter = UpcomingReservationAdapter(onGenerateQr = ::generateQr)
        binding.recyclerApproved.layoutManager = LinearLayoutManager(this)
        binding.recyclerApproved.adapter = adapter
    }

    override fun onResume() {
        super.onResume()
        loadApprovedReservations()
    }

    private fun loadApprovedReservations() {
        setLoading(true)
        lifecycleScope.launch {
            val result = repository.getMyDashboard()
            setLoading(false)

            result.onSuccess { dashboard ->
                render(dashboard.approvedFutureReservations)
            }.onFailure { error ->
                render(emptyList())
                binding.tvEmptyApproved.text =
                    error.message ?: getString(R.string.transfer_error_offline)
            }
        }
    }

    /**
     * Mints (or re-fetches) the QR, then opens the display screen.
     * The backend returns the existing token when one was already issued, so
     * tapping twice never creates a second QR for the same reservation.
     */
    private fun generateQr(reservation: UpcomingReservation) {
        setLoading(true)
        lifecycleScope.launch {
            val result = repository.generateQr(reservation.reservationId)
            setLoading(false)

            result.onSuccess { qr ->
                DatabaseHelper(this@ApprovedBookingActivity).use { db ->
                    db.cacheQrCode(qr, reservation.reservationId)
                }
                startActivity(
                    Intent(this@ApprovedBookingActivity, QRCodeActivity::class.java)
                        .putExtra(QRCodeActivity.EXTRA_TRANSACTION_ID, qr.transactionId)
                )
            }.onFailure { error ->
                // Surfaces the server wording, e.g. "This reservation's slot date has already passed."
                Toast.makeText(
                    this@ApprovedBookingActivity,
                    error.message ?: getString(R.string.transfer_error_offline),
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    private fun render(reservations: List<UpcomingReservation>) {
        adapter.submitReservations(reservations)
        val isEmpty = reservations.isEmpty()
        binding.tvEmptyApproved.visibility = if (isEmpty) View.VISIBLE else View.GONE
        binding.recyclerApproved.visibility = if (isEmpty) View.GONE else View.VISIBLE
        if (isEmpty) {
            binding.tvEmptyApproved.text = getString(R.string.transfer_empty_approved)
        }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.progressApproved.visibility = if (isLoading) View.VISIBLE else View.GONE
    }
}
