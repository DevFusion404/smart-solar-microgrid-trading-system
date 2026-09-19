package com.smartsolar.mobile.data.model

import com.google.gson.annotations.SerializedName

data class Reservation(
    @SerializedName("id")
    val id: String? = null,

    @SerializedName("reservationId")
    val reservationId: String = "",

    @SerializedName("stationId")
    val stationId: String = "",

    @SerializedName("stationName")
    val stationName: String = "",

    @SerializedName("slotId")
    val slotId: String = "",

    @SerializedName("userId")
    val userId: String = "",

    @SerializedName("reservedCapacity")
    val reservedCapacity: Double = 0.0,

    @SerializedName("slotDate")
    val slotDate: String = "",

    @SerializedName("startTime")
    val startTime: String = "",

    @SerializedName("endTime")
    val endTime: String = "",

    @SerializedName("createdAt")
    val createdAt: String = "",

    @SerializedName("status")
    val status: String = "Confirmed"
)

data class CreateReservationRequest(
    val slotId: String,
    val requestedCapacity: Double
)

data class UpdateReservationRequest(
    val requestedCapacity: Double
)
