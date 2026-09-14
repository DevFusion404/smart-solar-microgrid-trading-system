package com.smartsolar.mobile.data.model

import com.google.gson.annotations.SerializedName

data class EnergySlot(
    @SerializedName("id")
    val id: String? = null,

    @SerializedName("slotId")
    val slotId: String = "",

    @SerializedName("stationId")
    val stationId: String = "",

    @SerializedName("date")
    val date: String = "",

    @SerializedName("startTime")
    val startTime: String = "",

    @SerializedName("endTime")
    val endTime: String = "",

    @SerializedName("totalCapacity")
    val totalCapacity: Double = 0.0,

    @SerializedName("availableCapacity")
    val availableCapacity: Double = 0.0,

    @SerializedName("status")
    val status: String = "Available"
)

data class SlotCapacityUpdate(
    @SerializedName("availableCapacity")
    val availableCapacity: Double
)
