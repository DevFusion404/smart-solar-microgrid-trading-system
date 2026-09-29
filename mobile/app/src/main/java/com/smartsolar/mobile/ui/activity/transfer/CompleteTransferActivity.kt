package com.smartsolar.mobile.ui.activity.transfer

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.TransactionResponse
import com.smartsolar.mobile.data.repository.TransactionRepository
import com.smartsolar.mobile.databinding.ActivityCompleteTransferBinding
import com.smartsolar.mobile.utils.TransferFormat
import kotlinx.coroutines.launch

/**
 * Component 4 - the final step of the transfer flow.
 *
 * Scan QR -> Verify QR -> Display booking details -> Operator confirm ->
 * Complete transaction. This screen owns the last two steps: it captures the
 * metered amount and remarks, calls PUT /api/transactions/{id}/complete, then
 * shows the success summary.
 */
class CompleteTransferActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_TRANSACTION_ID = "extra_transaction_id"

        /** Reserved kWh, used as the default and the ceiling for the metered value. */
        const val EXTRA_RESERVED_ENERGY = "extra_reserved_energy"
    }

    private lateinit var binding: ActivityCompleteTransferBinding
    private val repository by lazy { TransactionRepository() }

    private lateinit var transactionId: String
    private var reservedEnergy: Double = 0.0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCompleteTransferBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarComplete.setNavigationOnClickListener { finish() }

        transactionId = intent.getStringExtra(EXTRA_TRANSACTION_ID).orEmpty()
        reservedEnergy = intent.getDoubleExtra(EXTRA_RESERVED_ENERGY, 0.0)

        if (transactionId.isBlank()) {
            showError(getString(R.string.transfer_error_verify))
            binding.groupForm.visibility = View.GONE
            return
        }

        binding.tvTransactionId.text = transactionId
        if (reservedEnergy > 0) {
            binding.inputEnergy.setText(reservedEnergy.toString())
        }

        binding.btnCompleteTransfer.setOnClickListener { completeTransfer() }
        binding.btnDone.setOnClickListener { finish() }
    }

    private fun completeTransfer() {
        val enteredEnergy = binding.inputEnergy.text?.toString()?.trim().orEmpty()
        val deliveredEnergy = enteredEnergy.toDoubleOrNull()

        // The API rejects more than the reserved amount, so catch it up front.
        if (enteredEnergy.isNotEmpty() && deliveredEnergy == null) {
            binding.inputEnergyLayout.error = getString(R.string.transfer_delivered_energy)
            return
        }
        if (deliveredEnergy != null && reservedEnergy > 0 && deliveredEnergy > reservedEnergy) {
            binding.inputEnergyLayout.error = TransferFormat.energy(reservedEnergy) + " max"
            return
        }
        binding.inputEnergyLayout.error = null

        val remarks = binding.inputRemarks.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }

        setLoading(true)
        lifecycleScope.launch {
            val result = repository.completeTransfer(transactionId, deliveredEnergy, remarks)
            setLoading(false)

            result.onSuccess { operation ->
                renderSuccess(deliveredEnergy, operation.transaction)
            }.onFailure { error ->
                showError(error.message ?: getString(R.string.transfer_error_offline))
            }
        }
    }

    private fun renderSuccess(deliveredEnergy: Double?, transaction: TransactionResponse?) {
        binding.groupForm.visibility = View.GONE
        binding.tvCompleteMessage.visibility = View.GONE
        binding.groupSuccess.visibility = View.VISIBLE

        binding.tvSuccessTransactionId.text =
            getString(R.string.transfer_label_transaction) + ": " + transactionId

        val energy = transaction?.energyAmount ?: deliveredEnergy ?: reservedEnergy
        binding.tvSuccessEnergy.text =
            getString(R.string.transfer_label_energy) + ": " + TransferFormat.energy(energy)

        val station = transaction?.stationName?.takeIf { it.isNotBlank() }
            ?: transaction?.stationId.orEmpty()
        binding.tvSuccessStation.text =
            getString(R.string.transfer_label_station) + ": " + station.ifBlank { "-" }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.progressComplete.visibility = if (isLoading) View.VISIBLE else View.GONE
        binding.btnCompleteTransfer.isEnabled = !isLoading
    }

    private fun showError(message: String) {
        binding.tvCompleteMessage.visibility = View.VISIBLE
        binding.tvCompleteMessage.text = message
    }
}
