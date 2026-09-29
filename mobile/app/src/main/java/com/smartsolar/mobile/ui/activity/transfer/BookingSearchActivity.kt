package com.smartsolar.mobile.ui.activity.transfer

import android.app.DatePickerDialog
import android.os.Bundle
import android.widget.ArrayAdapter
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.MaterialAutoCompleteTextView
import com.google.android.material.textfield.TextInputEditText
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.TransactionResponse
import com.smartsolar.mobile.utils.TransferFormat
import java.time.LocalDate

/**
 * Component 4 - search and filter the prosumer's own transfers.
 *
 * GET /api/transactions/search is restricted to Backoffice and GridOperator
 * roles, so a prosumer cannot call it. This screen therefore loads the caller's
 * own transfers through GET /api/transactions/my and filters them on device by
 * station name, slot date and transfer status.
 */
class BookingSearchActivity : BaseTransactionListActivity() {

    override val layoutResId = R.layout.activity_booking_search

    override val screenTitleRes = R.string.transfer_title_search

    /** Server-side filter; the rest is applied locally. */
    private var selectedStatus: String? = null
    private var selectedDate: LocalDate? = null
    private var stationQuery: String = ""

    private lateinit var inputStation: TextInputEditText
    private lateinit var inputDate: TextInputEditText
    private lateinit var inputStatus: MaterialAutoCompleteTextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        inputStation = findViewById(R.id.inputStation)
        inputDate = findViewById(R.id.inputDate)
        inputStatus = findViewById(R.id.inputStatus)

        setupStatusDropdown()
        setupDatePicker()

        findViewById<MaterialButton>(R.id.btnSearch).setOnClickListener { applyFilters() }
        findViewById<MaterialButton>(R.id.btnClear).setOnClickListener { clearFilters() }
    }

    private fun setupStatusDropdown() {
        // Mirrors TransferStatus.All on the backend.
        val statuses = listOf("Any", "Pending", "Verified", "Completed", "Failed", "Rejected")
        inputStatus.setAdapter(
            ArrayAdapter(this, android.R.layout.simple_list_item_1, statuses)
        )
        inputStatus.setOnItemClickListener { _, _, position, _ ->
            selectedStatus = statuses[position].takeIf { it != "Any" }
        }
    }

    private fun setupDatePicker() {
        inputDate.setOnClickListener {
            val today = selectedDate ?: LocalDate.now()
            DatePickerDialog(
                this,
                { _, year, month, dayOfMonth ->
                    // DatePickerDialog months are zero based.
                    selectedDate = LocalDate.of(year, month + 1, dayOfMonth)
                    inputDate.setText(TransferFormat.apiDate(selectedDate!!))
                },
                today.year,
                today.monthValue - 1,
                today.dayOfMonth
            ).show()
        }
    }

    private fun applyFilters() {
        stationQuery = inputStation.text?.toString()?.trim().orEmpty()
        loadTransactions()
    }

    private fun clearFilters() {
        stationQuery = ""
        selectedStatus = null
        selectedDate = null
        inputStation.setText("")
        inputDate.setText("")
        inputStatus.setText("", false)
        loadTransactions()
    }

    override suspend fun fetchTransactions(): Result<List<TransactionResponse>> =
        repository.getMyTransactions(status = selectedStatus).map { transactions ->
            transactions.filter(::matchesFilters)
        }

    private fun matchesFilters(transaction: TransactionResponse): Boolean {
        val stationMatches = stationQuery.isBlank() ||
            transaction.stationName.orEmpty().contains(stationQuery, ignoreCase = true) ||
            transaction.stationId.contains(stationQuery, ignoreCase = true)

        val dateMatches = selectedDate?.let { wanted ->
            // slotDate arrives as an ISO timestamp; compare the calendar day only.
            transaction.slotDate.startsWith(TransferFormat.apiDate(wanted))
        } ?: true

        return stationMatches && dateMatches
    }
}
