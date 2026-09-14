package com.smartsolar.mobile.data.model

import com.google.gson.annotations.SerializedName

data class Station(
    @SerializedName("id")
    val id: String? = null,

    @SerializedName("stationId")
    val stationId: String = "",

    @SerializedName("stationName")
    val stationName: String = "",

    @SerializedName("address")
    val address: String = "",

    @SerializedName("latitude")
    val latitude: Double = 0.0,

    @SerializedName("longitude")
    val longitude: Double = 0.0,

    @SerializedName("energyCapacity")
    val energyCapacity: Double = 0.0,

    @SerializedName("batteryStorageCapacity")
    val batteryStorageCapacity: Double = 0.0,

    @SerializedName("operationalSchedule")
    val operationalSchedule: String = "",

    @SerializedName("status")
    val status: String = "Active"
)

/**
 * Lightweight DTO for Google Maps pins returned by GET /api/stations/map
 */
data class StationMapPin(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("lat")
    val lat: Double,

    @SerializedName("lng")
    val lng: Double
)
