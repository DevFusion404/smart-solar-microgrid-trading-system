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
    private const val DAYS_IN_WINDOW = 7L

    fun showUpcoming(
        fragment: Fragment,
        selectedDate: LocalDate,
        onDateSelected: (LocalDate) -> Unit,
    ) {
        val today = LocalDate.now()
        show(
            fragment = fragment,
            selectedDate = selectedDate.coerceIn(today, today.plusDays(DAYS_IN_WINDOW - 1)),
            firstSelectableDate = today,
            lastSelectableDate = today.plusDays(DAYS_IN_WINDOW - 1),
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
        show(
            fragment = fragment,
            selectedDate = selectedDate.coerceIn(today.minusDays(DAYS_IN_WINDOW - 1), today),
            firstSelectableDate = today.minusDays(DAYS_IN_WINDOW - 1),
            lastSelectableDate = today,
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
                    onDateSelected(selectedMillis.toLocalDate())
                }
                show(fragment.parentFragmentManager, "reservation_date_picker")
            }
    }

    private fun LocalDate.toUtcMillis() = atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()

    private fun Long.toLocalDate() = Instant.ofEpochMilli(this).atZone(ZoneOffset.UTC).toLocalDate()
}
