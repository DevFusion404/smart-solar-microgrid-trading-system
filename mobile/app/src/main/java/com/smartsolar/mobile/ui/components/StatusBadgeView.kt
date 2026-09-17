package com.smartsolar.mobile.ui.components

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.smartsolar.mobile.R

// ──────────────────────────────────────────────────────────────────────────────
// StatusBadgeView — reusable compact chip that displays an account/slot status.
//
// Usage in XML:
//   <com.smartsolar.mobile.ui.components.StatusBadgeView
//       android:id="@+id/statusBadge"
//       android:layout_width="wrap_content"
//       android:layout_height="wrap_content" />
//
// Usage in code:
//   binding.statusBadge.setStatus("Active")
//   binding.statusBadge.setStatus(account.statusLabel)
// ──────────────────────────────────────────────────────────────────────────────
class StatusBadgeView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val tvLabel: TextView

    init {
        LayoutInflater.from(context).inflate(R.layout.view_status_badge, this, true)
        tvLabel = findViewById(R.id.tvStatusBadgeLabel)
    }

    /**
     * Sets the displayed status text and applies a matching color scheme.
     *
     * @param status Raw status string from the backend, e.g. "Active", "Deactivated".
     */
    fun setStatus(status: String) {
        tvLabel.text = when (status.lowercase()) {
            "active"                -> "Active"
            "pendingactivation"     -> "Pending"
            "deactivationrequested" -> "Deactivation Requested"
            "deactivated"           -> "Deactivated"
            "available"             -> "Available"
            "booked"                -> "Booked"
            "confirmed"             -> "Confirmed"
            "cancelled"             -> "Cancelled"
            "completed"             -> "Completed"
            else                    -> status
        }

        val (bgColor, textColor) = when (status.lowercase()) {
            "active", "available", "confirmed", "completed" ->
                Pair(R.color.badge_bg_green, R.color.badge_text_green)
            "pendingactivation", "booked" ->
                Pair(R.color.badge_bg_amber, R.color.badge_text_amber)
            "deactivationrequested" ->
                Pair(R.color.badge_bg_orange, R.color.badge_text_orange)
            "deactivated", "cancelled" ->
                Pair(R.color.badge_bg_red, R.color.badge_text_red)
            else ->
                Pair(R.color.badge_bg_slate, R.color.badge_text_slate)
        }

        tvLabel.backgroundTintList =
            ContextCompat.getColorStateList(context, bgColor)
        tvLabel.setTextColor(ContextCompat.getColor(context, textColor))
    }
}
