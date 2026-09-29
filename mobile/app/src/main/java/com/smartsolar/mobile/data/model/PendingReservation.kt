package com.smartsolar.mobile.data.model

import com.google.gson.annotations.SerializedName

/**
 * Component 4 - a reservation as the approval queue sees it.
 *
 * Mirrors backend/Models/EnergyReservation.cs over the wire. QrToken is
 * [JsonIgnore] on the server and never arrives here; QrIsActive is what tells
 * the operator a pass has been issued.
 */
data class PendingReservation(
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

    @SerializedName("prosumerNic")
    val prosumerNic: String? = null,

    @SerializedName("prosumerName")
    val prosumerName: String = "",

    @SerializedName("slotDate")
    val slotDate: String = "",

    /** Serialised from TimeSpan, so "22:50:00". */
    @SerializedName("startTime")
    val startTime: String = "",

    @SerializedName("endTime")
    val endTime: String = "",

    @SerializedName("reservedCapacity")
    val reservedCapacity: Double = 0.0,

    @SerializedName("status")
    val status: String = "",

    @SerializedName("createdAt")
    val createdAt: String = "",

    @SerializedName("qrGeneratedAt")
    val qrGeneratedAt: String? = null,

    /** True once approval has minted the reservation pass. */
    @SerializedName("qrIsActive")
    val qrIsActive: Boolean = false,
) {
    /** Statuses the backend treats as awaiting a decision. */
    val isPending: Boolean
        get() = status.equals("Reviewing", ignoreCase = true) ||
            status.equals("Pending", ignoreCase = true)

    /** Trims the seconds off a TimeSpan so the card reads "22:50 - 23:50". */
    val slotWindow: String
        get() = "${startTime.take(5)} - ${endTime.take(5)}"
}

/** Body of PATCH /api/backoffice/reservations/{id}/status. */
data class UpdateReservationStatusRequest(
    @SerializedName("status")
    val status: String,
)
