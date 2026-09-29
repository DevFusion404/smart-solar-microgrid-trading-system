package com.smartsolar.mobile.ui.activity.transfer

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.os.Bundle
import android.util.Base64
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.local.DatabaseHelper
import com.smartsolar.mobile.data.model.QrGenerationResponse
import com.smartsolar.mobile.data.repository.TransactionRepository
import com.smartsolar.mobile.databinding.ActivityQrCodeBinding
import com.smartsolar.mobile.utils.TransferFormat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Component 4 - displays the secure transfer QR.
 *
 * The payload is minted by the backend and carries the reservation id,
 * transaction id, single-use token and expiry. The image is taken from the
 * server's base64 PNG when present; otherwise it is rendered locally with
 * ZXing from the same payload, so the screen still works if the API sends
 * only the token.
 */
class QRCodeActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_TRANSACTION_ID = "extra_transaction_id"

        /** Optional: mint a QR for this reservation instead of loading one. */
        const val EXTRA_RESERVATION_ID = "extra_reservation_id"

        private const val QR_SIZE_PX = 720
    }

    private lateinit var binding: ActivityQrCodeBinding
    private val repository by lazy { TransactionRepository() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityQrCodeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbarQr.setNavigationOnClickListener { finish() }

        val transactionId = intent.getStringExtra(EXTRA_TRANSACTION_ID)
        val reservationId = intent.getStringExtra(EXTRA_RESERVATION_ID)

        when {
            !transactionId.isNullOrBlank() -> loadQr(transactionId)
            !reservationId.isNullOrBlank() -> mintQr(reservationId)
            else -> showError(getString(R.string.transfer_error_verify))
        }
    }

    /** Re-renders an existing QR, falling back to the SQLite copy when offline. */
    private fun loadQr(transactionId: String) {
        setLoading(true)
        lifecycleScope.launch {
            val result = repository.getQr(transactionId)
            setLoading(false)

            result.onSuccess { render(it) }.onFailure { error ->
                val cached = DatabaseHelper(this@QRCodeActivity).use { db ->
                    db.getCachedQrCode(transactionId)
                }
                if (cached != null) {
                    render(cached)
                    showError(getString(R.string.transfer_showing_cached))
                } else {
                    showError(error.message ?: getString(R.string.transfer_error_offline))
                }
            }
        }
    }

    /** Issues a QR for a reservation, or returns the existing one. */
    private fun mintQr(reservationId: String) {
        setLoading(true)
        lifecycleScope.launch {
            val result = repository.generateQr(reservationId)
            setLoading(false)

            result.onSuccess { qr ->
                DatabaseHelper(this@QRCodeActivity).use { db -> db.cacheQrCode(qr, reservationId) }
                render(qr)
            }.onFailure { error ->
                showError(error.message ?: getString(R.string.transfer_error_offline))
            }
        }
    }

    private fun render(qr: QrGenerationResponse) {
        binding.tvTransactionId.text = qr.transactionId
        binding.tvReservationId.text =
            qr.transaction?.reservationId?.takeIf { it.isNotBlank() } ?: "-"
        binding.tvStationName.text =
            qr.transaction?.stationName?.takeIf { it.isNotBlank() }
                ?: qr.transaction?.stationId ?: "-"
        binding.tvEnergyAmount.text = TransferFormat.energy(qr.transaction?.energyAmount ?: 0.0)

        if (TransferFormat.isExpired(qr.expiryDate)) {
            binding.tvExpiry.text = getString(R.string.transfer_qr_expired)
            showError(getString(R.string.transfer_error_expired))
        } else {
            binding.tvExpiry.text =
                getString(R.string.transfer_qr_expires) + ": " + TransferFormat.dateTime(qr.expiryDate)
        }

        lifecycleScope.launch {
            val bitmap = withContext(Dispatchers.Default) { buildBitmap(qr) }
            if (bitmap != null) {
                binding.imgQrCode.setImageBitmap(bitmap)
            } else {
                showError(getString(R.string.transfer_error_verify))
            }
        }
    }

    /**
     * Prefers the server-rendered PNG so the scanner reads exactly what the
     * backend signed; falls back to local ZXing rendering of the same payload.
     */
    private fun buildBitmap(qr: QrGenerationResponse): Bitmap? {
        decodeBase64(qr.qrImageData)?.let { return it }

        val payload = qr.qrPayload.takeIf { it.isNotBlank() }
            ?: qr.qrToken.takeIf { it.isNotBlank() }
            ?: return null

        return encodeQr(payload)
    }

    /** Accepts both a bare base64 string and a data: URI. */
    private fun decodeBase64(raw: String): Bitmap? {
        if (raw.isBlank()) return null
        return try {
            val payload = raw.substringAfter("base64,", raw)
            val bytes = Base64.decode(payload, Base64.DEFAULT)
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        } catch (exception: Exception) {
            null
        }
    }

    private fun encodeQr(payload: String): Bitmap? = try {
        val matrix = QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, QR_SIZE_PX, QR_SIZE_PX)
        val bitmap = Bitmap.createBitmap(QR_SIZE_PX, QR_SIZE_PX, Bitmap.Config.RGB_565)
        for (x in 0 until QR_SIZE_PX) {
            for (y in 0 until QR_SIZE_PX) {
                bitmap.setPixel(x, y, if (matrix[x, y]) Color.BLACK else Color.WHITE)
            }
        }
        bitmap
    } catch (exception: Exception) {
        null
    }

    private fun setLoading(isLoading: Boolean) {
        binding.progressQr.visibility = if (isLoading) View.VISIBLE else View.GONE
    }

    private fun showError(message: String) {
        binding.tvQrMessage.visibility = View.VISIBLE
        binding.tvQrMessage.text = message
    }
}
