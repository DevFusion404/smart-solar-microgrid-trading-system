package com.smartsolar.mobile.ui.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.local.DatabaseHelper
import com.smartsolar.mobile.data.local.SessionManager
import com.smartsolar.mobile.data.repository.ReservationRepository
import com.smartsolar.mobile.data.repository.SlotRepository
import com.smartsolar.mobile.data.repository.StationRepository
import com.smartsolar.mobile.databinding.FragmentHomeDashboardBinding
import com.smartsolar.mobile.ui.activity.MainActivity
import kotlinx.coroutines.launch
import java.util.Locale

class HomeDashboardFragment : Fragment() {

    private var _binding: FragmentHomeDashboardBinding? = null
    private val binding get() = _binding!!

    private lateinit var stationRepository: StationRepository
    private lateinit var slotRepository: SlotRepository
    private lateinit var reservationRepository: ReservationRepository
    private lateinit var dbHelper: DatabaseHelper

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        stationRepository = StationRepository(requireContext())
        slotRepository = SlotRepository(requireContext())
        reservationRepository = ReservationRepository(requireContext())
        dbHelper = DatabaseHelper(requireContext())

        setupUserHeader()
        setupClickListeners()
        loadDashboardTelemetry()
    }

    private fun setupUserHeader() {
        val displayName = SessionManager.getDisplayName(requireContext())
            ?: SessionManager.getUsername(requireContext())
            ?: activity?.intent?.getStringExtra("USER_NAME")
            ?: "Prosumer"

        binding.tvHomeWelcome.text = "Hello, $displayName 👋"
    }

    private fun setupClickListeners() {
        // Quick Action: Reserve Energy
        binding.cardActionReserve.setOnClickListener {
            (activity as? MainActivity)?.navigateToReservation()
        }
        binding.cardKpiReserved.setOnClickListener {
            (activity as? MainActivity)?.navigateToReservation()
        }
        binding.btnBookFirstSlot.setOnClickListener {
            (activity as? MainActivity)?.navigateToReservation()
        }

        // Quick Action: Microgrid Stations
        binding.cardActionStations.setOnClickListener {
            (activity as? MainActivity)?.navigateToStations()
        }
        binding.cardKpiYield.setOnClickListener {
            (activity as? MainActivity)?.navigateToStations()
        }

        // Quick Action: My Bookings
        binding.cardActionBookings.setOnClickListener {
            (activity as? MainActivity)?.navigateToMyReservations()
        }
        binding.btnViewAllBookings.setOnClickListener {
            (activity as? MainActivity)?.navigateToMyReservations()
        }

        // Quick Action: Offline Sync
        binding.cardActionSync.setOnClickListener {
            triggerDataSync()
        }

        // Refresh Telemetry Button
        binding.btnRefreshHome.setOnClickListener {
            loadDashboardTelemetry(showToast = true)
        }
    }

    private fun loadDashboardTelemetry(showToast: Boolean = false) {
        lifecycleScope.launch {
            // 1. Load Station info from local SQLite or network
            val localStations = dbHelper.getAllStations()
            val activeCount = if (localStations.isNotEmpty()) {
                localStations.count { it.status.equals("Active", ignoreCase = true) }
            } else {
                4 // Fallback default online nodes
            }
            binding.tvActiveNodesCount.text = "📍 $activeCount Microgrid Stations Online"

            // 2. Load User Reservations
            val resResult = reservationRepository.getAllReservations()
            if (resResult.isSuccess) {
                val reservations = resResult.getOrDefault(emptyList())
                if (reservations.isNotEmpty()) {
                    val activeReservations = reservations.filter {
                        !it.status.equals("Cancelled", ignoreCase = true) &&
                        !it.status.equals("Rejected", ignoreCase = true)
                    }

                    val totalReservedKwh = activeReservations.sumOf { it.reservedCapacity }
                    if (totalReservedKwh > 0) {
                        binding.tvKpiReservedEnergy.text = String.format(Locale.US, "%.1f", totalReservedKwh)
                    }

                    // Display upcoming reservation in card
                    val upcoming = activeReservations.firstOrNull()
                    if (upcoming != null) {
                        binding.layoutHasReservation.visibility = View.VISIBLE
                        binding.layoutNoReservation.visibility = View.GONE
                        binding.tvUpcomingStationName.text = upcoming.stationName.ifBlank { "Microgrid Station" }
                        binding.tvUpcomingStatusBadge.text = upcoming.status.uppercase()
                        binding.tvUpcomingSlotSchedule.text = "📅 ${upcoming.slotDate} • ${upcoming.startTime} - ${upcoming.endTime}"
                        binding.tvUpcomingCapacity.text = "${upcoming.reservedCapacity.toInt()} kWh"
                    } else {
                        binding.layoutHasReservation.visibility = View.GONE
                        binding.layoutNoReservation.visibility = View.VISIBLE
                    }
                } else {
                    binding.layoutHasReservation.visibility = View.GONE
                    binding.layoutNoReservation.visibility = View.VISIBLE
                }
            } else {
                // If API call fails (e.g. offline), show clean empty state
                binding.layoutHasReservation.visibility = View.GONE
                binding.layoutNoReservation.visibility = View.VISIBLE
            }

            if (showToast && isAdded) {
                Toast.makeText(requireContext(), "✓ Telemetry updated", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun triggerDataSync() {
        lifecycleScope.launch {
            Toast.makeText(requireContext(), "Syncing microgrid nodes & slots...", Toast.LENGTH_SHORT).show()
            val stationsSync = stationRepository.syncStations()
            if (stationsSync.isSuccess) {
                val stationCount = stationsSync.getOrDefault(0)
                val localStations = stationRepository.getStations(false).getOrDefault(emptyList())
                val slotsSync = slotRepository.syncAllSlots(localStations)
                val slotCount = slotsSync.getOrDefault(0)

                if (isAdded) {
                    binding.tvActiveNodesCount.text = "📍 $stationCount Microgrid Stations Online"
                    Toast.makeText(
                        requireContext(),
                        "✓ Synced: $stationCount nodes & $slotCount slots stored locally",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } else {
                val err = stationsSync.exceptionOrNull()?.message ?: "Sync failed"
                if (isAdded) {
                    Toast.makeText(requireContext(), "⚠ Sync Notice: $err", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
