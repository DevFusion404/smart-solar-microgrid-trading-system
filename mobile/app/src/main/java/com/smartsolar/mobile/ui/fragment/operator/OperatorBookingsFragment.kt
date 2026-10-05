package com.smartsolar.mobile.ui.fragment.operator

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.model.PendingReservation
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.data.repository.TransactionRepository
import com.smartsolar.mobile.databinding.FragmentOperatorBookingsBinding
import com.smartsolar.mobile.ui.adapter.BookingStatus
import com.smartsolar.mobile.ui.adapter.OperatorBookingAdapter
import kotlinx.coroutines.async
import kotlinx.coroutines.launch

/**
 * Grid Operator - Bookings & Reservations.
 *
 * Shows the reservations prosumers placed on the nodes assigned to the signed-in
 * operator. The list comes from GET api/backoffice/reservations, which the server
 * already limits to the operator's assigned nodes, so a reservation appears here
 * as soon as a prosumer books a slot at one of those nodes.
 *
 * The screen is read-only: approving or declining stays in the Energy Transfers
 * approval queue.
 */
class OperatorBookingsFragment : Fragment() {

    private var _binding: FragmentOperatorBookingsBinding? = null
    private val binding get() = _binding!!

    private val repository by lazy { TransactionRepository() }
    private lateinit var adapter: OperatorBookingAdapter

    private var operatorId: String = ""
    private var assignedNodes: List<Station> = emptyList()
    private var assignedNodesLoaded = false
    private var reservations: List<PendingReservation> = emptyList()
    private var loadError: String? = null

    // Node filter: null means every assigned node
    private var selectedStationId: String? = null
    private var nodeOptions: List<NodeOption> = emptyList()

    /** One entry of the node filter dropdown. */
    private data class NodeOption(val stationId: String?, val label: String)

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOperatorBookingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        operatorId = activity?.intent?.getStringExtra("OPERATOR_ID")
            ?: context?.let { com.smartsolar.mobile.data.local.SessionManager.getUsername(it) }
            ?: ""

        setupRecyclerView()
        setupListeners()
    }

    // Reloads every time the screen comes back, so new reservations show up
    override fun onResume() {
        super.onResume()
        loadBookings()
    }

    private fun setupRecyclerView() {
        adapter = OperatorBookingAdapter()
        binding.rvOperatorBookings.layoutManager = LinearLayoutManager(requireContext())
        binding.rvOperatorBookings.adapter = adapter
    }

    private fun setupListeners() {
        binding.btnRefreshBookings.setOnClickListener {
            loadBookings(isManual = true)
        }

        binding.chipGroupBookingStatus.setOnCheckedStateChangeListener { _, _ ->
            render()
        }

        binding.actvBookingNodeFilter.setOnItemClickListener { _, _, position, _ ->
            selectedStationId = nodeOptions.getOrNull(position)?.stationId
            render()
        }
    }

    /**
     * Loads the operator's assigned nodes and the reservations on them together.
     * The node list only feeds the filter and the empty state, so the screen still
     * works when that call fails.
     */
    private fun loadBookings(isManual: Boolean = false) {
        binding.pbBookingsLoading.visibility = View.VISIBLE
        viewLifecycleOwner.lifecycleScope.launch {
            val nodesRequest = async { fetchAssignedNodes() }
            val result = repository.getOperatorReservations()
            val nodes = nodesRequest.await()

            binding.pbBookingsLoading.visibility = View.GONE

            if (nodes != null) {
                assignedNodes = nodes
                assignedNodesLoaded = true
            }

            result.onSuccess { list ->
                reservations = list
                loadError = null
                if (isManual) {
                    Toast.makeText(requireContext(), "Reservations refreshed (${list.size} loaded)", Toast.LENGTH_SHORT).show()
                }
            }.onFailure { error ->
                val message = error.message ?: "Could not load reservations"
                loadError = message
                // Keep showing the last loaded list; only tell the user the refresh failed
                if (reservations.isNotEmpty()) {
                    Toast.makeText(requireContext(), message, Toast.LENGTH_LONG).show()
                }
            }

            refreshNodeFilter()
            render()
        }
    }

    // Nodes assigned to this operator, or null when the list could not be loaded
    private suspend fun fetchAssignedNodes(): List<Station>? = try {
        val response = RetrofitClient.apiService.getAssignedNodesByOperator(operatorId)
        if (response.isSuccessful) response.body() else null
    } catch (e: Exception) {
        null
    }

    /**
     * Rebuilds the node dropdown: "All assigned nodes" plus one entry per node with
     * its reservation count. Falls back to the nodes named in the reservations when
     * the assigned-node list is not available.
     */
    private fun refreshNodeFilter() {
        // (station id, station name) pairs
        val known: List<Pair<String, String>> = if (assignedNodes.isNotEmpty()) {
            assignedNodes.map { station ->
                val id = station.stationId.ifBlank { station.id ?: "" }
                id to station.stationName.ifBlank { id }
            }
        } else {
            reservations.map { it.stationId to it.stationName.ifBlank { it.stationId } }
        }
        val nodes = known
            .filter { it.first.isNotBlank() }
            .distinctBy { it.first.lowercase() }
            .sortedBy { it.second.lowercase() }

        val options = mutableListOf(NodeOption(null, "All assigned nodes (${reservations.size})"))
        nodes.forEach { (id, name) ->
            val count = reservations.count { it.stationId.equals(id, ignoreCase = true) }
            options.add(NodeOption(id, "$name ($count)"))
        }
        nodeOptions = options

        // The selected node may have been unassigned since the last load
        val selected = options.firstOrNull { it.stationId.equals(selectedStationId, ignoreCase = true) }
            ?: options.first()
        selectedStationId = selected.stationId

        binding.actvBookingNodeFilter.setAdapter(
            ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, options.map { it.label })
        )
        binding.actvBookingNodeFilter.setText(selected.label, false)
    }

    // The status picked in the chip row, or null for "All"
    private fun selectedStatus(): BookingStatus? = when (binding.chipGroupBookingStatus.checkedChipId) {
        R.id.chipBookingPending -> BookingStatus.PENDING
        R.id.chipBookingApproved -> BookingStatus.APPROVED
        R.id.chipBookingCompleted -> BookingStatus.COMPLETED
        R.id.chipBookingCancelled -> BookingStatus.CANCELLED
        else -> null
    }

    // Applies the node and status filters and updates the list, summary and empty state
    private fun render() {
        val status = selectedStatus()
        val stationId = selectedStationId
        val visible = reservations.filter { reservation ->
            (stationId == null || reservation.stationId.equals(stationId, ignoreCase = true)) &&
                (status == null || BookingStatus.of(reservation) == status)
        }

        adapter.submitList(visible)

        val total = reservations.size
        val pending = reservations.count { it.isPending }
        binding.tvBookingsSummary.text = when {
            total == 0 && loadError != null -> "Reservations could not be loaded"
            total == 0 -> "No reservations on your assigned nodes"
            visible.size != total -> "Showing ${visible.size} of $total reservation(s)"
            else -> "$total reservation(s)  ·  $pending awaiting approval"
        }

        val isEmpty = visible.isEmpty()
        binding.layoutEmptyBookings.visibility = if (isEmpty) View.VISIBLE else View.GONE
        binding.rvOperatorBookings.visibility = if (isEmpty) View.GONE else View.VISIBLE
        if (isEmpty) showEmptyState(total)
    }

    // Picks the empty-state wording that explains why the list is empty
    private fun showEmptyState(total: Int) {
        val (title, message) = when {
            total == 0 && loadError != null ->
                "Couldn't Load Reservations" to "$loadError\n\nTap Refresh to try again."
            total == 0 && assignedNodesLoaded && assignedNodes.isEmpty() ->
                "No Assigned Microgrid Nodes" to
                    "Backoffice officers assign nodes to your operator account. Reservations placed on those nodes will appear here."
            total == 0 ->
                "No Reservations Yet" to
                    "When a prosumer reserves energy at one of your assigned nodes, it will appear here."
            else ->
                "No Matching Reservations" to "No reservations match the selected node and status."
        }
        binding.tvEmptyBookingsTitle.text = title
        binding.tvEmptyBookingsMessage.text = message
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
