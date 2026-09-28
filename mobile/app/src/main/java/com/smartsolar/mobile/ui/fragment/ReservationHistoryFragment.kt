package com.smartsolar.mobile.ui.fragment

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.model.Reservation
import com.smartsolar.mobile.data.repository.ReservationRepository
import com.smartsolar.mobile.databinding.ReservationHistoryBinding
import com.smartsolar.mobile.ui.adapter.ReservationHistoryAdapter
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlinx.coroutines.launch

class ReservationHistoryFragment : Fragment(R.layout.reservation_history) {

    private var _binding: ReservationHistoryBinding? = null
    private val binding get() = _binding!!

    private var selectedHistoryDate = LocalDate.now().minusDays(1)
    private lateinit var historyAdapter: ReservationHistoryAdapter
    private lateinit var reservationRepository: ReservationRepository
    private var isLoadingHistory = false
    private var historyLoadMessage: String? = null
    private val historyReservations = mutableListOf<ReservationUi>()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = ReservationHistoryBinding.bind(view)
        reservationRepository = ReservationRepository(requireContext())

        historyAdapter = ReservationHistoryAdapter(emptyList())
        binding.rvReservationHistory.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = historyAdapter
        }

        binding.btnSelectHistoryDate.text = selectedHistoryDate.toHistoryDateLabel()
        binding.btnSelectHistoryDate.setOnClickListener {
            ReservationDatePicker.showHistory(this, selectedHistoryDate) { date ->
                selectedHistoryDate = date
                binding.btnSelectHistoryDate.text = date.toHistoryDateLabel()
                loadHistory()
            }
        }

        loadHistory()
    }

    private fun loadHistory() {
        isLoadingHistory = true
        historyLoadMessage = null
        renderHistory()

        viewLifecycleOwner.lifecycleScope.launch {
            reservationRepository.getReservationHistory(selectedHistoryDate).fold(
                onSuccess = { reservations ->
                    historyReservations.clear()
                    historyReservations += reservations.map { it.toHistoryReservationUi() }
                },
                onFailure = { error ->
                    historyReservations.clear()
                    historyLoadMessage = error.message ?: "Unable to load reservation history."
                },
            )
            isLoadingHistory = false
            renderHistory()
        }
    }

    private fun renderHistory() {
        historyAdapter.submitHistory(historyReservations)
        binding.pbReservationHistory.visibility = if (isLoadingHistory) View.VISIBLE else View.GONE
        binding.rvReservationHistory.visibility =
            if (isLoadingHistory || historyReservations.isEmpty()) View.INVISIBLE else View.VISIBLE
        binding.tvReservationHistoryMessage.visibility =
            if (!isLoadingHistory && historyReservations.isEmpty()) View.VISIBLE else View.GONE

        if (!isLoadingHistory && historyReservations.isEmpty()) {
            binding.tvReservationHistoryMessage.text = historyLoadMessage
                ?: "No reservation history found for ${selectedHistoryDate.toHistoryDateLabel()}."
        }

        val bookedReservations = historyReservations.filterNot {
            it.status.equals("Cancelled", ignoreCase = true)
        }
        binding.tvHistoryEnergyTotal.text =
            "${bookedReservations.sumOf { it.energyKwh() }.toHistoryEnergyLabel()} kWh"
        binding.tvHistoryCompletedCount.text = historyReservations.count {
            it.status.equals("Completed", ignoreCase = true)
        }.toString()
    }

    private fun Reservation.toHistoryReservationUi(): ReservationUi {
        val bookingDate = slotDate.toHistoryLocalDateOrNull()
        return ReservationUi(
            id = reservationId,
            station = stationName.ifBlank { stationId },
            date = bookingDate?.formatHistoryDate() ?: slotDate,
            time = "${startTime.toHistoryTimeLabel()} - ${endTime.toHistoryTimeLabel()}",
            energy = "${reservedCapacity.toHistoryEnergyLabel()} kWh",
            status = status,
            createdAt = createdAt,
            reservationDate = bookingDate,
        )
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

private fun ReservationUi.energyKwh(): Double =
    energy.substringBefore(" ").replace(",", "").toDoubleOrNull() ?: 0.0

private fun Double.toHistoryEnergyLabel(): String =
    if (this % 1.0 == 0.0) toInt().toString() else String.format(Locale.getDefault(), "%.1f", this)

private fun String.toHistoryLocalDateOrNull(): LocalDate? =
    runCatching { Instant.parse(this).atZone(ZoneId.systemDefault()).toLocalDate() }.getOrNull()
        ?: runCatching { LocalDate.parse(take(10)) }.getOrNull()

private fun String.toHistoryTimeLabel(): String =
    runCatching {
        LocalTime.parse(this).format(DateTimeFormatter.ofPattern("hh:mm a", Locale.getDefault()))
    }.getOrDefault(this)

private fun LocalDate.formatHistoryDate(): String =
    format(DateTimeFormatter.ofPattern("dd MMM", Locale.getDefault()))

private fun LocalDate.toHistoryDateLabel(): String {
    val formatter = DateTimeFormatter.ofPattern("EEE, dd MMM", Locale.getDefault())
    return if (this == LocalDate.now().minusDays(1)) "Yesterday, ${format(formatter)}" else format(formatter)
}
