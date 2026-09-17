package com.smartsolar.mobile.ui.fragment.operator

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.lifecycle.lifecycleScope
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.gson.Gson
import com.smartsolar.mobile.data.api.RetrofitClient
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.databinding.DialogOperatorNodeDetailBinding
import kotlinx.coroutines.launch

class OperatorNodeDetailDialogFragment : BottomSheetDialogFragment() {

    private var _binding: DialogOperatorNodeDetailBinding? = null
    private val binding get() = _binding!!

    private var currentStation: Station? = null
    var onStationUpdated: ((Station) -> Unit)? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val stationJson = arguments?.getString(ARG_STATION_JSON)
        if (!stationJson.isNullOrBlank()) {
            currentStation = Gson().fromJson(stationJson, Station::class.java)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogOperatorNodeDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val station = currentStation ?: run {
            dismiss()
            return
        }

        bindStationDetails(station)
        setupListeners(station)
    }

    private fun bindStationDetails(station: Station) {
        binding.tvDetailNodeName.text = station.stationName.ifBlank { "Microgrid Node" }
        binding.tvDetailNodeCode.text = "${station.stationId} • ${station.status.uppercase()}"
        binding.tvDetailAddress.text = station.address.ifBlank { "Not specified" }
        binding.tvDetailCoordinates.text = "Lat: ${station.latitude}° | Lng: ${station.longitude}°"

        binding.tvDetailSolarCap.text = "${station.energyCapacity} kWh"
        binding.tvDetailBatteryCap.text = "${station.batteryStorageCapacity} kWh"
        binding.tvDetailSchedule.text = "Schedule: ${station.operationalSchedule.ifBlank { "08:00 AM - 08:00 PM" }}"

        // Pre-fill update inputs
        binding.etEditBattery.setText(station.batteryStorageCapacity.toString())
        binding.etEditSolar.setText(station.energyCapacity.toString())
        binding.etEditSchedule.setText(station.operationalSchedule)
    }

    private fun setupListeners(station: Station) {
        binding.btnDetailClose.setOnClickListener {
            dismiss()
        }

        binding.btnCancelDetail.setOnClickListener {
            dismiss()
        }

        binding.btnSaveBatteryUpdate.setOnClickListener {
            val batteryStr = binding.etEditBattery.text?.toString()?.trim()
            val solarStr = binding.etEditSolar.text?.toString()?.trim()
            val scheduleStr = binding.etEditSchedule.text?.toString()?.trim().orEmpty()

            val batteryVal = batteryStr?.toDoubleOrNull() ?: station.batteryStorageCapacity
            val solarVal = solarStr?.toDoubleOrNull() ?: station.energyCapacity

            if (batteryVal < 0) {
                binding.tilEditBattery.error = "Battery storage capacity must be >= 0"
                return@setOnClickListener
            }
            binding.tilEditBattery.error = null

            val updatedStation = station.copy(
                batteryStorageCapacity = batteryVal,
                energyCapacity = solarVal,
                operationalSchedule = scheduleStr
            )

            binding.btnSaveBatteryUpdate.isEnabled = false
            binding.btnSaveBatteryUpdate.text = "Updating..."

            lifecycleScope.launch {
                try {
                    val stationDocId = station.id?.ifBlank { station.stationId } ?: station.stationId
                    val response = RetrofitClient.apiService.updateStation(stationDocId, updatedStation)
                    if (response.isSuccessful) {
                        Toast.makeText(requireContext(), "Node & battery availability updated!", Toast.LENGTH_SHORT).show()
                        onStationUpdated?.invoke(updatedStation)
                        dismiss()
                    } else {
                        Toast.makeText(requireContext(), "Update failed: ${response.code()}", Toast.LENGTH_SHORT).show()
                        binding.btnSaveBatteryUpdate.isEnabled = true
                        binding.btnSaveBatteryUpdate.text = "💾 Update Availability"
                    }
                } catch (e: Exception) {
                    Toast.makeText(requireContext(), "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                    binding.btnSaveBatteryUpdate.isEnabled = true
                    binding.btnSaveBatteryUpdate.text = "💾 Update Availability"
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val ARG_STATION_JSON = "arg_station_json"

        fun newInstance(station: Station): OperatorNodeDetailDialogFragment {
            return OperatorNodeDetailDialogFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_STATION_JSON, Gson().toJson(station))
                }
            }
        }
    }
}
