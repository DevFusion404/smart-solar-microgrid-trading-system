package com.smartsolar.mobile.ui.fragment

import androidx.fragment.app.Fragment
import com.google.android.material.datepicker.CalendarConstraints
import com.google.android.material.datepicker.CompositeDateValidator
import com.google.android.material.datepicker.DateValidatorPointBackward
import com.google.android.material.datepicker.DateValidatorPointForward
import com.google.android.material.datepicker.MaterialDatePicker
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

object ReservationDatePicker {
    // Inclusive reservation window: today plus the next six calendar days.
    private const val MAX_RESERVATION_DAYS_AHEAD = 6L
    private const val HISTORY_DAYS = 7L

    fun showUpcoming(
        fragment: Fragment,
        selectedDate: LocalDate,
        onDateSelected: (LocalDate) -> Unit,
    ) {
        val today = LocalDate.now()
        val lastReservableDate = today.plusDays(MAX_RESERVATION_DAYS_AHEAD)
        show(
            fragment = fragment,
            selectedDate = selectedDate.coerceIn(today, lastReservableDate),
            firstSelectableDate = today,
            lastSelectableDate = lastReservableDate,
            title = "Choose a reservation day",
            onDateSelected = onDateSelected,
        )
    }

    fun showHistory(
        fragment: Fragment,
        selectedDate: LocalDate,
        onDateSelected: (LocalDate) -> Unit,
    ) {
        val today = LocalDate.now()
        val latestHistoryDate = today.minusDays(1)
        show(
            fragment = fragment,
            selectedDate = selectedDate.coerceIn(today.minusDays(HISTORY_DAYS), latestHistoryDate),
            firstSelectableDate = today.minusDays(HISTORY_DAYS),
            lastSelectableDate = latestHistoryDate,
            title = "Choose a history day",
            onDateSelected = onDateSelected,
        )
    }

    private fun show(
        fragment: Fragment,
        selectedDate: LocalDate,
        firstSelectableDate: LocalDate,
        lastSelectableDate: LocalDate,
        title: String,
        onDateSelected: (LocalDate) -> Unit,
    ) {
        if (!fragment.isAdded) return

        val constraints = CalendarConstraints.Builder()
            .setStart(firstSelectableDate.toUtcMillis())
            .setEnd(lastSelectableDate.toUtcMillis())
            .setOpenAt(selectedDate.toUtcMillis())
            .setValidator(
                CompositeDateValidator.allOf(
                    listOf(
                        DateValidatorPointForward.from(firstSelectableDate.toUtcMillis()),
                        DateValidatorPointBackward.before(lastSelectableDate.toUtcMillis()),
                    ),
                ),
            )
            .build()

        MaterialDatePicker.Builder.datePicker()
            .setTitleText(title)
            .setSelection(selectedDate.toUtcMillis())
            .setCalendarConstraints(constraints)
            .build()
            .apply {
                addOnPositiveButtonClickListener { selectedMillis ->
                    val date = selectedMillis.toLocalDate()
                    if (!date.isBefore(firstSelectableDate) && !date.isAfter(lastSelectableDate)) {
                        onDateSelected(date)
                    }
                }
                show(fragment.parentFragmentManager, "reservation_date_picker")
            }
    }

    private fun LocalDate.toUtcMillis() = atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()

    private fun Long.toLocalDate() = Instant.ofEpochMilli(this).atZone(ZoneOffset.UTC).toLocalDate()
}
