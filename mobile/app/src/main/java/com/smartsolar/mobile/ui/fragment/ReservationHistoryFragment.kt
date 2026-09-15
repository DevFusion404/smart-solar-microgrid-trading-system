package com.smartsolar.mobile.ui.fragment

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.smartsolar.mobile.R
import com.smartsolar.mobile.databinding.ReservationHistoryBinding
import com.smartsolar.mobile.ui.adapter.ReservationHistoryAdapter
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

class ReservationHistoryFragment : Fragment(R.layout.reservation_history) {

    private var selectedHistoryDate = LocalDate.now().minusDays(1)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val binding = ReservationHistoryBinding.bind(view)

        val today = LocalDate.now()
        val history = listOf(
            ReservationUi("RES-2038", "Galle Solar Hub", today.minusDays(1).formatHistoryDate(), "01:00 - 02:00", "350 kWh", "Completed", "Yesterday, 2:02 PM"),
            ReservationUi("RES-2031", "Colombo Solar Hub", today.minusDays(3).formatHistoryDate(), "09:00 - 10:00", "420 kWh", "Completed", "3 days ago, 10:04 AM"),
            ReservationUi("RES-2028", "Jaffna Microgrid", today.minusDays(5).formatHistoryDate(), "04:00 - 05:00", "220 kWh", "Cancelled", "5 days ago, 6:15 PM"),
        )
        val historyDates = mapOf(
            "RES-2038" to today.minusDays(1),
            "RES-2031" to today.minusDays(3),
            "RES-2028" to today.minusDays(5),
        )
        val historyAdapter = ReservationHistoryAdapter(history)

        fun applyHistoryFilter() {
            historyAdapter.submitHistory(history.filter { historyDates[it.id] == selectedHistoryDate })
        }

        binding.btnSelectHistoryDate.text = selectedHistoryDate.toHistoryDateLabel()
        binding.btnSelectHistoryDate.setOnClickListener {
            ReservationDatePicker.showHistory(this, selectedHistoryDate) { date ->
                selectedHistoryDate = date
                binding.btnSelectHistoryDate.text = date.toHistoryDateLabel()
                applyHistoryFilter()
            }
        }

        binding.rvReservationHistory.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = historyAdapter
        }
    }
}

private fun LocalDate.formatHistoryDate() = format(DateTimeFormatter.ofPattern("dd MMM", Locale.getDefault()))

private fun LocalDate.toHistoryDateLabel(): String {
    val formatter = DateTimeFormatter.ofPattern("EEE, dd MMM", Locale.getDefault())
    return if (this == LocalDate.now().minusDays(1)) "Yesterday, ${format(formatter)}" else format(formatter)
}
