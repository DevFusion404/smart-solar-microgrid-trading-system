package com.smartsolar.mobile.ui.activity.transfer

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.PendingReservation
import com.smartsolar.mobile.data.repository.TransactionRepository
import com.smartsolar.mobile.databinding.ActivityPendingReservationsBinding
import com.smartsolar.mobile.ui.adapter.PendingReservationAdapter
import kotlinx.coroutines.launch

/**
 * Component 4 - the grid operator reservation approval queue.
 *
 * Approving calls PATCH /api/backoffice/reservations/{id}/status, which the
 * server answers by setting the reservation's QrToken, QrGeneratedAt and
 * QrIsActive in the same update. The prosumer's QR pass therefore exists the
 * moment approval succeeds; there is no second call to make.
 *
 * Declining releases the slot capacity, so it is confirmed first.
 */
class PendingReservationsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPendingReservationsBinding
    private lateinit var adapter: PendingReservationAdapter
    private val repository by lazy { TransactionRepository() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPendingReservationsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarPending.setNavigationOnClickListener { finish() }
        binding.swipeRefreshPending.setOnRefreshListener { loadQueue(isRefresh = true) }

        adapter = PendingReservationAdapter(
            onApprove = ::approve,
            onDecline = ::confirmDecline,
        )
        binding.recyclerPending.layoutManager = LinearLayoutManager(this)
        binding.recyclerPending.adapter = adapter
    }

    override fun onResume() {
        super.onResume()
        loadQueue()
    }

    private fun loadQueue(isRefresh: Boolean = false) {
        if (!isRefresh) binding.swipeRefreshPending.isRefreshing = true

        lifecycleScope.launch {
            val operatorId = com.smartsolar.mobile.data.local.SessionManager.getUsername(this@PendingReservationsActivity) ?: ""
            val assignedStationIds: Set<String>? = try {
                if (operatorId.isNotBlank()) {
                    val resp = com.smartsolar.mobile.data.api.RetrofitClient.apiService.getAssignedNodesByOperator(operatorId)
                    if (resp.isSuccessful && resp.body() != null) {
                        resp.body()!!.map { it.stationId }.toSet()
                    } else null
                } else null
            } catch (e: Exception) {
                val dbHelper = com.smartsolar.mobile.data.local.DatabaseHelper(this@PendingReservationsActivity)
                val localNodes = dbHelper.getAllStations().filter {
                    it.assignedOperatorId?.equals(operatorId, ignoreCase = true) == true ||
                            it.assignedOperatorName?.equals(operatorId, ignoreCase = true) == true
                }
                localNodes.map { it.stationId }.toSet()
            }

            val result = repository.getPendingReservations()
            binding.swipeRefreshPending.isRefreshing = false

            result.onSuccess { list ->
                val filtered = if (assignedStationIds != null) {
                    list.filter { assignedStationIds.contains(it.stationId) }
                } else {
                    list
                }
                render(filtered)
            }.onFailure { error ->
                render(emptyList())
                binding.tvEmptyPending.text =
                    error.message ?: getString(R.string.transfer_error_offline)
            }
        }
    }

    private fun approve(reservation: PendingReservation) {
        setBusy(true)
        lifecycleScope.launch {
            val result = repository.approveReservation(reservation.reservationId)
            setBusy(false)

            result.onSuccess { approved ->
                // QrIsActive comes back true, which is the pass being issued.
                val message = if (approved.qrIsActive) {
                    getString(R.string.reservation_approved_with_qr)
                } else {
                    getString(R.string.reservation_approved)
                }
                Toast.makeText(this@PendingReservationsActivity, message, Toast.LENGTH_LONG).show()
                loadQueue()
            }.onFailure { error ->
                Toast.makeText(
                    this@PendingReservationsActivity,
                    error.message ?: getString(R.string.transfer_error_offline),
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    /** Declining frees the reserved capacity, so it is not undoable from here. */
    private fun confirmDecline(reservation: PendingReservation) {
        AlertDialog.Builder(this)
            .setTitle(R.string.reservation_decline)
            .setMessage(getString(R.string.reservation_decline_confirm, reservation.reservationId))
            .setPositiveButton(R.string.reservation_decline) { _, _ -> decline(reservation) }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun decline(reservation: PendingReservation) {
        setBusy(true)
        lifecycleScope.launch {
            val result = repository.cancelReservation(reservation.reservationId)
            setBusy(false)

            result.onSuccess {
                Toast.makeText(
                    this@PendingReservationsActivity,
                    R.string.reservation_declined,
                    Toast.LENGTH_SHORT
                ).show()
                loadQueue()
            }.onFailure { error ->
                Toast.makeText(
                    this@PendingReservationsActivity,
                    error.message ?: getString(R.string.transfer_error_offline),
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    private fun render(reservations: List<PendingReservation>) {
        adapter.submitReservations(reservations)
        val isEmpty = reservations.isEmpty()
        binding.tvEmptyPending.visibility = if (isEmpty) View.VISIBLE else View.GONE
        binding.recyclerPending.visibility = if (isEmpty) View.GONE else View.VISIBLE
        if (isEmpty) {
            binding.tvEmptyPending.text = getString(R.string.reservation_queue_empty)
        }
    }

    private fun setBusy(isBusy: Boolean) {
        binding.swipeRefreshPending.isRefreshing = isBusy
    }
}
