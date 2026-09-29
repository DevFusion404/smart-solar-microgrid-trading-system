package com.smartsolar.mobile.ui.activity.transfer

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.TransactionResponse
import com.smartsolar.mobile.data.repository.TransactionRepository
import com.smartsolar.mobile.databinding.ActivityQrVerificationBinding
import com.smartsolar.mobile.utils.TransferFormat
import kotlinx.coroutines.launch

/**
 * Component 4 - QR verification result and the operator decision point.
 *
 * Reached two ways:
 *   1. From the scanner, carrying the verdict of POST /api/transactions/verify-qr.
 *   2. From the operator queue, carrying only a transaction id, which is then
 *      loaded through GET /api/transactions/{id}.
 *
 * The four outcomes required by the module spec map to the backend error codes:
 *   valid -> success, QR_INVALID -> Invalid QR Code, QR_EXPIRED -> QR Code
 *   Expired, QR_USED / TRANSFER_ALREADY_COMPLETED -> Transaction Already Completed.
 */
class QRVerificationActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_SUCCESS = "extra_success"
        const val EXTRA_MESSAGE = "extra_message"
        const val EXTRA_ERROR_CODE = "extra_error_code"
        const val EXTRA_TRANSACTION_ID = "extra_transaction_id"
    }

    private lateinit var binding: ActivityQrVerificationBinding
    private val repository by lazy { TransactionRepository() }

    private var transaction: TransactionResponse? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityQrVerificationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarVerification.setNavigationOnClickListener { finish() }
        binding.btnScanAgain.setOnClickListener {
            startActivity(Intent(this, QRScannerActivity::class.java))
            finish()
        }

        val transactionId = intent.getStringExtra(EXTRA_TRANSACTION_ID)

        // Coming from the queue there is no verdict, only an id to load.
        if (!intent.hasExtra(EXTRA_SUCCESS)) {
            if (transactionId.isNullOrBlank()) {
                renderOutcome(false, getString(R.string.transfer_error_verify), null)
            } else {
                loadTransaction(transactionId)
            }
            return
        }

        val success = intent.getBooleanExtra(EXTRA_SUCCESS, false)
        val message = intent.getStringExtra(EXTRA_MESSAGE).orEmpty()
        val errorCode = intent.getStringExtra(EXTRA_ERROR_CODE)

        renderOutcome(success, message, errorCode)

        if (success && !transactionId.isNullOrBlank()) {
            loadTransaction(transactionId)
        }
    }

    /** Maps the backend verdict onto the four states the spec requires. */
    private fun renderOutcome(success: Boolean, message: String, errorCode: String?) {
        val titleRes = when {
            success -> R.string.transfer_qr_valid
            errorCode.equals("QR_EXPIRED", ignoreCase = true) ||
                errorCode.equals("RESERVATION_EXPIRED", ignoreCase = true) ->
                R.string.transfer_qr_expired_title
            errorCode.equals("QR_USED", ignoreCase = true) ||
                errorCode.equals("TRANSFER_ALREADY_COMPLETED", ignoreCase = true) ->
                R.string.transfer_qr_used
            else -> R.string.transfer_qr_invalid
        }

        binding.tvOutcomeTitle.setText(titleRes)
        binding.tvOutcomeMessage.text = message.ifBlank { getString(titleRes) }

        val background = if (success) R.color.badge_bg_green else R.color.badge_bg_red
        val foreground = if (success) R.color.badge_text_green else R.color.badge_text_red
        binding.cardOutcome.setCardBackgroundColor(ContextCompat.getColor(this, background))
        binding.tvOutcomeTitle.setTextColor(ContextCompat.getColor(this, foreground))
        binding.tvOutcomeMessage.setTextColor(ContextCompat.getColor(this, foreground))

        // Only a valid code may be confirmed or rejected.
        val actionVisibility = if (success) View.VISIBLE else View.GONE
        binding.btnConfirm.visibility = actionVisibility
        binding.btnReject.visibility = actionVisibility
    }

    private fun loadTransaction(transactionId: String) {
        setLoading(true)
        lifecycleScope.launch {
            val result = repository.getTransaction(transactionId)
            setLoading(false)

            result.onSuccess { loaded ->
                transaction = loaded
                renderDetails(loaded)

                // Reached from the queue: derive the outcome from the stored status.
                if (!intent.hasExtra(EXTRA_SUCCESS)) {
                    val isActionable = loaded.transferStatus.equals("Verified", ignoreCase = true)
                    renderOutcome(
                        isActionable,
                        getString(R.string.transfer_label_status) + ": " + loaded.transferStatus,
                        if (loaded.transferStatus.equals("Completed", ignoreCase = true)) {
                            "TRANSFER_ALREADY_COMPLETED"
                        } else {
                            null
                        }
                    )
                }

                binding.btnConfirm.setOnClickListener { promptForCompletion(loaded) }
                binding.btnReject.setOnClickListener { promptForRejection(loaded) }
            }.onFailure { error ->
                Toast.makeText(
                    this@QRVerificationActivity,
                    error.message ?: getString(R.string.transfer_error_offline),
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    private fun renderDetails(loaded: TransactionResponse) {
        binding.cardDetails.visibility = View.VISIBLE
        binding.tvProsumerName.text =
            loaded.prosumerName?.takeIf { it.isNotBlank() } ?: loaded.prosumerNic
        binding.tvReservationId.text = loaded.reservationId
        binding.tvStationName.text =
            loaded.stationName?.takeIf { it.isNotBlank() } ?: loaded.stationId
        binding.tvEnergyAmount.text = TransferFormat.energy(loaded.energyAmount)
        binding.tvSlot.text = TransferFormat.date(loaded.slotDate) + " - " + loaded.slotTime
    }

    /**
     * Hands over to the completion screen, which captures the metered amount.
     * The reserved figure is passed through as the default and the ceiling.
     */
    private fun promptForCompletion(loaded: TransactionResponse) {
        startActivity(
            Intent(this, CompleteTransferActivity::class.java)
                .putExtra(CompleteTransferActivity.EXTRA_TRANSACTION_ID, loaded.transactionId)
                .putExtra(CompleteTransferActivity.EXTRA_RESERVED_ENERGY, loaded.energyAmount)
        )
        finish()
    }

    private fun promptForRejection(loaded: TransactionResponse) {
        val input = EditText(this).apply {
            hint = getString(R.string.transfer_reject_reason)
            setPadding(48, 32, 48, 32)
        }

        AlertDialog.Builder(this)
            .setTitle(R.string.transfer_btn_reject)
            .setView(input)
            .setPositiveButton(R.string.transfer_btn_reject) { _, _ ->
                val reason = input.text?.toString()?.trim().orEmpty()
                if (reason.isEmpty()) {
                    Toast.makeText(this, R.string.transfer_reject_reason, Toast.LENGTH_SHORT).show()
                } else {
                    reject(loaded.transactionId, reason)
                }
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun reject(transactionId: String, reason: String) {
        setLoading(true)
        lifecycleScope.launch {
            val result = repository.rejectTransfer(transactionId, reason)
            setLoading(false)

            result.onSuccess {
                Toast.makeText(
                    this@QRVerificationActivity, it.message, Toast.LENGTH_LONG
                ).show()
                finish()
            }.onFailure { error ->
                Toast.makeText(
                    this@QRVerificationActivity,
                    error.message ?: getString(R.string.transfer_error_offline),
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.progressVerification.visibility = if (isLoading) View.VISIBLE else View.GONE
    }
}
