package com.smartsolar.mobile.ui.fragment

import java.time.LocalDate
import java.time.LocalDateTime

data class ReservationUi(
    val id: String,
    val station: String,
    val date: String,
    val time: String,
    val energy: String,
    val status: String,
    val createdAt: String,
    val reservationDate: LocalDate? = null,
    val requestedAt: LocalDateTime? = null,
)
