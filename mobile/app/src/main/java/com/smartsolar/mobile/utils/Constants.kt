package com.smartsolar.mobile.utils

object Constants {
    /**
     * Base URL for connecting to the ASP.NET Core backend.
     * Note: In the Android Emulator, "10.0.2.2" refers to the host machine's "localhost".
     * If testing on a physical device over Wi-Fi, change this to your machine's LAN IP.
     */
    //const val BASE_URL = "http://10.0.2.2:5295/"
    const val BASE_URL = "http://192.168.56.1:5295"

    // Request Timeout
    const val NETWORK_TIMEOUT_SECONDS = 30L

    // Database
    const val DATABASE_NAME = "smart_solar_local.db"
    const val DATABASE_VERSION = 1
}
