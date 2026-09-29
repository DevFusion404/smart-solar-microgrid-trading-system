package com.smartsolar.mobile.ui.activity.transfer

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.zxing.BarcodeFormat
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult
import com.journeyapps.barcodescanner.DefaultDecoderFactory
import com.smartsolar.mobile.R
import com.smartsolar.mobile.databinding.ActivityQrScannerBinding
import com.smartsolar.mobile.data.repository.TransactionRepository
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * Component 4 - Grid operator QR scanner.
 *
 * Opens the camera, decodes the QR, extracts the secure token and posts it to
 * POST /api/transactions/verify-qr. The backend answers 200 for invalid codes
 * too, so the result screen reads the success flag rather than the HTTP status.
 *
 * A manual-entry fallback is provided for damaged codes and for testing on
 * devices without a usable camera.
 */
class QRScannerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityQrScannerBinding
    private val repository by lazy { TransactionRepository() }

    /** Guards against the decoder firing repeatedly while a call is in flight. */
    private var isVerifying = false

    private val cameraPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            startScanning()
        } else {
            binding.tvScannerHint.text = getString(R.string.transfer_scanner_permission)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityQrScannerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarScanner.setNavigationOnClickListener { finish() }
        binding.btnManualEntry.setOnClickListener { promptForToken() }

        // Only QR codes; ignoring other symbologies avoids accidental reads.
        binding.barcodeScanner.barcodeView.decoderFactory =
            DefaultDecoderFactory(listOf(BarcodeFormat.QR_CODE))

        ensureCameraPermission()
    }

    override fun onResume() {
        super.onResume()
        if (hasCameraPermission()) binding.barcodeScanner.resume()
    }

    override fun onPause() {
        super.onPause()
        binding.barcodeScanner.pause()
    }

    private fun hasCameraPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED

    private fun ensureCameraPermission() {
        if (hasCameraPermission()) startScanning()
        else cameraPermission.launch(Manifest.permission.CAMERA)
    }

    private fun startScanning() {
        binding.barcodeScanner.decodeContinuous(object : BarcodeCallback {
            override fun barcodeResult(result: BarcodeResult) {
                if (isVerifying) return
                val token = extractToken(result.text) ?: return
                verify(token)
            }
        })
    }

    /**
     * The QR carries the JSON payload the backend minted, keyed on
     * "transactionToken" (see Helpers/QrCodeGenerator.cs). The server's own
     * ExtractToken already accepts either that JSON payload or a bare token,
     * so the scanned value is passed through untouched and the server stays the
     * single authority on what a valid payload looks like.
     *
     * The key is read here only so a malformed code is caught before a round
     * trip; anything unrecognised is still forwarded for the server to judge.
     */
    private fun extractToken(scanned: String?): String? {
        val raw = scanned?.trim().orEmpty()
        if (raw.isEmpty()) return null

        if (!raw.startsWith("{")) return raw

        return try {
            val json = JSONObject(raw)
            // Matches TokenPropertyName on the backend; casing is ignored there.
            json.optString("transactionToken").takeIf { it.isNotBlank() } ?: raw
        } catch (exception: Exception) {
            raw
        }
    }

    private fun promptForToken() {
        val input = EditText(this).apply {
            hint = getString(R.string.transfer_qr_token)
            setPadding(48, 32, 48, 32)
        }

        AlertDialog.Builder(this)
            .setTitle(R.string.transfer_scanner_manual)
            .setView(input)
            .setPositiveButton(R.string.transfer_search_apply) { _, _ ->
                val token = input.text?.toString()?.trim().orEmpty()
                if (token.isNotEmpty()) verify(token)
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun verify(qrToken: String) {
        isVerifying = true
        binding.barcodeScanner.pause()
        binding.progressScanner.visibility = View.VISIBLE

        lifecycleScope.launch {
            val result = repository.verifyQr(qrToken)
            binding.progressScanner.visibility = View.GONE

            result.onSuccess { verification ->
                // Hand both outcomes to the result screen; it renders valid,
                // invalid, expired and already-completed states.
                startActivity(
                    Intent(this@QRScannerActivity, QRVerificationActivity::class.java)
                        .putExtra(QRVerificationActivity.EXTRA_SUCCESS, verification.success)
                        .putExtra(QRVerificationActivity.EXTRA_MESSAGE, verification.message)
                        .putExtra(QRVerificationActivity.EXTRA_ERROR_CODE, verification.errorCode)
                        .putExtra(
                            QRVerificationActivity.EXTRA_TRANSACTION_ID,
                            verification.transactionDetails?.transactionId
                        )
                )
                finish()
            }.onFailure { error ->
                // A transport failure is not a verdict, so stay on the scanner.
                Toast.makeText(
                    this@QRScannerActivity,
                    error.message ?: getString(R.string.transfer_error_offline),
                    Toast.LENGTH_LONG
                ).show()
                isVerifying = false
                binding.barcodeScanner.resume()
            }
        }
    }
}
