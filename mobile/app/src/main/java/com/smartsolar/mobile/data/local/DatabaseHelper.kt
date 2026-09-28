package com.smartsolar.mobile.data.local

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.smartsolar.mobile.data.model.EnergySlot
import com.smartsolar.mobile.data.model.Reservation
import com.smartsolar.mobile.data.model.SessionRecord
import com.smartsolar.mobile.data.model.Station
import com.smartsolar.mobile.utils.Constants

/**
 * Native Android SQLite Database Helper for offline caching and local storage.
 * Manages cached stations, energy slots, and user bookings.
 */
class DatabaseHelper(context: Context) : SQLiteOpenHelper(
    context,
    Constants.DATABASE_NAME,
    null,
    Constants.DATABASE_VERSION
) {

    companion object {
        // Table Names
        const val TABLE_STATIONS = "stations"
        const val TABLE_SLOTS = "energy_slots"
        const val TABLE_RESERVATIONS = "reservations"
        const val TABLE_SESSIONS = "sessions"

        // Stations Columns
        const val COL_ID = "id"
        const val COL_STATION_ID = "station_id"
        const val COL_STATION_NAME = "station_name"
        const val COL_ADDRESS = "address"
        const val COL_LATITUDE = "latitude"
        const val COL_LONGITUDE = "longitude"
        const val COL_ENERGY_CAPACITY = "energy_capacity"
        const val COL_BATTERY_STORAGE = "battery_storage_capacity"
        const val COL_SCHEDULE = "operational_schedule"
        const val COL_STATUS = "status"

        // Slots Columns
        const val COL_SLOT_ID = "slot_id"
        const val COL_DATE = "date"
        const val COL_START_TIME = "start_time"
        const val COL_END_TIME = "end_time"
        const val COL_TOTAL_CAPACITY = "total_capacity"
        const val COL_AVAILABLE_CAPACITY = "available_capacity"

        // Reservations Columns
        const val COL_RESERVATION_ID = "reservation_id"
        const val COL_USER_ID = "user_id"
        const val COL_RESERVED_CAPACITY = "reserved_capacity"
        const val COL_CREATED_AT = "created_at"
        const val COL_IS_SYNCED = "is_synced"

        // Sessions Columns
        const val COL_SESSION_USER_ID = "user_id"
        const val COL_SESSION_USERNAME = "username"
        const val COL_SESSION_FULL_NAME = "full_name"
        const val COL_SESSION_EMAIL = "email"
        const val COL_SESSION_PHONE = "phone_number"
        const val COL_SESSION_ROLE = "role"
        const val COL_SESSION_STATUS = "status"
        const val COL_SESSION_NIC = "nic"
        const val COL_SESSION_ADDRESS = "address"
        const val COL_SESSION_JWT = "jwt_token"
        const val COL_SESSION_EXPIRES_AT = "expires_at"
        const val COL_SESSION_LOGGED_IN_AT = "logged_in_at"
        const val COL_SESSION_IS_ACTIVE = "is_active_session"
    }

    override fun onCreate(db: SQLiteDatabase) {
        // Create Stations Table
        val createStationsTable = """
            CREATE TABLE $TABLE_STATIONS (
                $COL_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COL_STATION_ID TEXT UNIQUE NOT NULL,
                $COL_STATION_NAME TEXT NOT NULL,
                $COL_ADDRESS TEXT,
                $COL_LATITUDE REAL,
                $COL_LONGITUDE REAL,
                $COL_ENERGY_CAPACITY REAL,
                $COL_BATTERY_STORAGE REAL,
                $COL_SCHEDULE TEXT,
                $COL_STATUS TEXT
            )
        """.trimIndent()

        // Create Energy Slots Table
        val createSlotsTable = """
            CREATE TABLE $TABLE_SLOTS (
                $COL_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COL_SLOT_ID TEXT UNIQUE NOT NULL,
                $COL_STATION_ID TEXT NOT NULL,
                $COL_DATE TEXT,
                $COL_START_TIME TEXT,
                $COL_END_TIME TEXT,
                $COL_TOTAL_CAPACITY REAL,
                $COL_AVAILABLE_CAPACITY REAL,
                $COL_STATUS TEXT,
                FOREIGN KEY ($COL_STATION_ID) REFERENCES $TABLE_STATIONS ($COL_STATION_ID) ON DELETE CASCADE
            )
        """.trimIndent()

        // Create Reservations Table (supports offline caching)
        val createReservationsTable = """
            CREATE TABLE $TABLE_RESERVATIONS (
                $COL_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COL_RESERVATION_ID TEXT UNIQUE NOT NULL,
                $COL_STATION_ID TEXT NOT NULL,
                $COL_SLOT_ID TEXT NOT NULL,
                $COL_USER_ID TEXT,
                $COL_RESERVED_CAPACITY REAL,
                $COL_CREATED_AT TEXT,
                $COL_STATUS TEXT,
                $COL_IS_SYNCED INTEGER DEFAULT 1
            )
        """.trimIndent()

        // Create Sessions Table — stores authenticated user session synced from MongoDB
        val createSessionsTable = """
            CREATE TABLE $TABLE_SESSIONS (
                $COL_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COL_SESSION_USER_ID TEXT,
                $COL_SESSION_USERNAME TEXT UNIQUE NOT NULL,
                $COL_SESSION_FULL_NAME TEXT NOT NULL,
                $COL_SESSION_EMAIL TEXT NOT NULL,
                $COL_SESSION_PHONE TEXT,
                $COL_SESSION_ROLE TEXT NOT NULL,
                $COL_SESSION_STATUS TEXT NOT NULL,
                $COL_SESSION_NIC TEXT,
                $COL_SESSION_ADDRESS TEXT,
                $COL_SESSION_JWT TEXT NOT NULL,
                $COL_SESSION_EXPIRES_AT TEXT,
                $COL_SESSION_LOGGED_IN_AT TEXT NOT NULL,
                $COL_SESSION_IS_ACTIVE INTEGER NOT NULL DEFAULT 0
            )
        """.trimIndent()

        db.execSQL(createStationsTable)
        db.execSQL(createSlotsTable)
        db.execSQL(createReservationsTable)
        db.execSQL(createSessionsTable)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) {
            // Version 2: add sessions table for SQLite-backed user session storage
            val createSessionsTable = """
                CREATE TABLE IF NOT EXISTS $TABLE_SESSIONS (
                    $COL_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    $COL_SESSION_USER_ID TEXT,
                    $COL_SESSION_USERNAME TEXT UNIQUE NOT NULL,
                    $COL_SESSION_FULL_NAME TEXT NOT NULL,
                    $COL_SESSION_EMAIL TEXT NOT NULL,
                    $COL_SESSION_PHONE TEXT,
                    $COL_SESSION_ROLE TEXT NOT NULL,
                    $COL_SESSION_STATUS TEXT NOT NULL,
                    $COL_SESSION_NIC TEXT,
                    $COL_SESSION_ADDRESS TEXT,
                    $COL_SESSION_JWT TEXT NOT NULL,
                    $COL_SESSION_EXPIRES_AT TEXT,
                    $COL_SESSION_LOGGED_IN_AT TEXT NOT NULL,
                    $COL_SESSION_IS_ACTIVE INTEGER NOT NULL DEFAULT 0
                )
            """.trimIndent()
            db.execSQL(createSessionsTable)
        }
    }

    // ── Station CRUD Operations ───────────────────────────────────────────────

    fun insertOrUpdateStation(station: Station): Long {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COL_STATION_ID, station.stationId)
            put(COL_STATION_NAME, station.stationName)
            put(COL_ADDRESS, station.address)
            put(COL_LATITUDE, station.latitude)
            put(COL_LONGITUDE, station.longitude)
            put(COL_ENERGY_CAPACITY, station.energyCapacity)
            put(COL_BATTERY_STORAGE, station.batteryStorageCapacity)
            put(COL_SCHEDULE, station.operationalSchedule)
            put(COL_STATUS, station.status)
        }
        return db.insertWithOnConflict(
            TABLE_STATIONS,
            null,
            values,
            SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    fun insertStations(stations: List<Station>) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            for (station in stations) {
                insertOrUpdateStation(station)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    fun getAllStations(): List<Station> {
        val list = mutableListOf<Station>()
        val db = readableDatabase
        val cursor: Cursor = db.query(TABLE_STATIONS, null, null, null, null, null, "$COL_STATION_NAME ASC")

        cursor.use {
            while (it.moveToNext()) {
                list.add(
                    Station(
                        id = it.getString(it.getColumnIndexOrThrow(COL_ID)),
                        stationId = it.getString(it.getColumnIndexOrThrow(COL_STATION_ID)),
                        stationName = it.getString(it.getColumnIndexOrThrow(COL_STATION_NAME)),
                        address = it.getString(it.getColumnIndexOrThrow(COL_ADDRESS)),
                        latitude = it.getDouble(it.getColumnIndexOrThrow(COL_LATITUDE)),
                        longitude = it.getDouble(it.getColumnIndexOrThrow(COL_LONGITUDE)),
                        energyCapacity = it.getDouble(it.getColumnIndexOrThrow(COL_ENERGY_CAPACITY)),
                        batteryStorageCapacity = it.getDouble(it.getColumnIndexOrThrow(COL_BATTERY_STORAGE)),
                        operationalSchedule = it.getString(it.getColumnIndexOrThrow(COL_SCHEDULE)),
                        status = it.getString(it.getColumnIndexOrThrow(COL_STATUS))
                    )
                )
            }
        }
        return list
    }

    fun getStationById(stationId: String): Station? {
        val db = readableDatabase
        val cursor = db.query(
            TABLE_STATIONS,
            null,
            "$COL_STATION_ID = ?",
            arrayOf(stationId),
            null,
            null,
            null
        )

        cursor.use {
            if (it.moveToFirst()) {
                return Station(
                    id = it.getString(it.getColumnIndexOrThrow(COL_ID)),
                    stationId = it.getString(it.getColumnIndexOrThrow(COL_STATION_ID)),
                    stationName = it.getString(it.getColumnIndexOrThrow(COL_STATION_NAME)),
                    address = it.getString(it.getColumnIndexOrThrow(COL_ADDRESS)),
                    latitude = it.getDouble(it.getColumnIndexOrThrow(COL_LATITUDE)),
                    longitude = it.getDouble(it.getColumnIndexOrThrow(COL_LONGITUDE)),
                    energyCapacity = it.getDouble(it.getColumnIndexOrThrow(COL_ENERGY_CAPACITY)),
                    batteryStorageCapacity = it.getDouble(it.getColumnIndexOrThrow(COL_BATTERY_STORAGE)),
                    operationalSchedule = it.getString(it.getColumnIndexOrThrow(COL_SCHEDULE)),
                    status = it.getString(it.getColumnIndexOrThrow(COL_STATUS))
                )
            }
        }
        return null
    }

    // ── Energy Slot CRUD Operations ───────────────────────────────────────────

    fun insertOrUpdateSlot(slot: EnergySlot): Long {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COL_SLOT_ID, slot.slotId)
            put(COL_STATION_ID, slot.stationId)
            val dateClean = if (slot.date.contains("T")) slot.date.split("T")[0] else slot.date
            put(COL_DATE, dateClean)
            put(COL_START_TIME, slot.startTime)
            put(COL_END_TIME, slot.endTime)
            put(COL_TOTAL_CAPACITY, slot.totalCapacity)
            put(COL_AVAILABLE_CAPACITY, slot.availableCapacity)
            put(COL_STATUS, slot.status)
        }
        return db.insertWithOnConflict(
            TABLE_SLOTS,
            null,
            values,
            SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    fun insertSlots(slots: List<EnergySlot>) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            for (slot in slots) {
                insertOrUpdateSlot(slot)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    fun getSlotsByStation(stationId: String): List<EnergySlot> {
        return getSlotsByStationAndDate(stationId, null)
    }

    fun getSlotsByStationAndDate(stationId: String, date: String?): List<EnergySlot> {
        val list = mutableListOf<EnergySlot>()
        val db = readableDatabase

        val selection: String?
        val selectionArgs: Array<String>?

        if (date != null && date.isNotBlank()) {
            val datePrefix = date.take(10)
            selection = "$COL_STATION_ID = ? AND $COL_DATE LIKE ?"
            selectionArgs = arrayOf(stationId, "$datePrefix%")
        } else {
            selection = "$COL_STATION_ID = ?"
            selectionArgs = arrayOf(stationId)
        }

        val cursor = db.query(
            TABLE_SLOTS,
            null,
            selection,
            selectionArgs,
            null,
            null,
            "$COL_DATE ASC, $COL_START_TIME ASC"
        )

        cursor.use {
            while (it.moveToNext()) {
                list.add(
                    EnergySlot(
                        id = it.getString(it.getColumnIndexOrThrow(COL_ID)),
                        slotId = it.getString(it.getColumnIndexOrThrow(COL_SLOT_ID)),
                        stationId = it.getString(it.getColumnIndexOrThrow(COL_STATION_ID)),
                        date = it.getString(it.getColumnIndexOrThrow(COL_DATE)),
                        startTime = it.getString(it.getColumnIndexOrThrow(COL_START_TIME)),
                        endTime = it.getString(it.getColumnIndexOrThrow(COL_END_TIME)),
                        totalCapacity = it.getDouble(it.getColumnIndexOrThrow(COL_TOTAL_CAPACITY)),
                        availableCapacity = it.getDouble(it.getColumnIndexOrThrow(COL_AVAILABLE_CAPACITY)),
                        status = it.getString(it.getColumnIndexOrThrow(COL_STATUS))
                    )
                )
            }
        }
        return list
    }

    fun updateSlotCapacity(slotId: String, newCapacity: Double): Int {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COL_AVAILABLE_CAPACITY, newCapacity)
        }
        return db.update(TABLE_SLOTS, values, "$COL_SLOT_ID = ?", arrayOf(slotId))
    }

    // ── Reservation Operations ───────────────────────────────────────────────

    fun insertReservation(reservation: Reservation): Long {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COL_RESERVATION_ID, reservation.reservationId)
            put(COL_STATION_ID, reservation.stationId)
            put(COL_SLOT_ID, reservation.slotId)
            put(COL_USER_ID, reservation.userId)
            put(COL_RESERVED_CAPACITY, reservation.reservedCapacity)
            put(COL_CREATED_AT, reservation.createdAt)
            put(COL_STATUS, reservation.status)
        }
        return db.insertWithOnConflict(
            TABLE_RESERVATIONS,
            null,
            values,
            SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    fun getAllReservations(): List<Reservation> {
        val list = mutableListOf<Reservation>()
        val db = readableDatabase
        val cursor = db.query(TABLE_RESERVATIONS, null, null, null, null, null, "$COL_CREATED_AT DESC")

        cursor.use {
            while (it.moveToNext()) {
                list.add(
                    Reservation(
                        id = it.getString(it.getColumnIndexOrThrow(COL_ID)),
                        reservationId = it.getString(it.getColumnIndexOrThrow(COL_RESERVATION_ID)),
                        stationId = it.getString(it.getColumnIndexOrThrow(COL_STATION_ID)),
                        slotId = it.getString(it.getColumnIndexOrThrow(COL_SLOT_ID)),
                        userId = it.getString(it.getColumnIndexOrThrow(COL_USER_ID)),
                        reservedCapacity = it.getDouble(it.getColumnIndexOrThrow(COL_RESERVED_CAPACITY)),
                        createdAt = it.getString(it.getColumnIndexOrThrow(COL_CREATED_AT)),
                        status = it.getString(it.getColumnIndexOrThrow(COL_STATUS))
                    )
                )
            }
        }
        return list
    }

    fun clearAllData() {
        val db = writableDatabase
        db.delete(TABLE_RESERVATIONS, null, null)
        db.delete(TABLE_SLOTS, null, null)
        db.delete(TABLE_STATIONS, null, null)
    }

    // ── Session CRUD Operations ───────────────────────────────────────────────

    /**
     * Upserts the authenticated user session into SQLite.
     * - Deactivates all previous sessions.
     * - Inserts or replaces (by UNIQUE username) the new session as the active one.
     * MongoDB is the source of truth; this is a local cache synced on every login.
     */
    fun saveSession(
        userId: String,
        username: String,
        fullName: String,
        email: String,
        phoneNumber: String,
        role: String,
        status: String,
        nic: String?,
        address: String?,
        jwtToken: String,
        expiresAt: String,
        loggedInAt: String
    ): Long {
        val db = writableDatabase
        db.beginTransaction()
        return try {
            // Mark all existing sessions as inactive
            val deactivate = ContentValues().apply { put(COL_SESSION_IS_ACTIVE, 0) }
            db.update(TABLE_SESSIONS, deactivate, null, null)

            // Upsert the new active session
            val values = ContentValues().apply {
                put(COL_SESSION_USER_ID, userId)
                put(COL_SESSION_USERNAME, username)
                put(COL_SESSION_FULL_NAME, fullName)
                put(COL_SESSION_EMAIL, email)
                put(COL_SESSION_PHONE, phoneNumber)
                put(COL_SESSION_ROLE, role)
                put(COL_SESSION_STATUS, status)
                put(COL_SESSION_NIC, nic)
                put(COL_SESSION_ADDRESS, address)
                put(COL_SESSION_JWT, jwtToken)
                put(COL_SESSION_EXPIRES_AT, expiresAt)
                put(COL_SESSION_LOGGED_IN_AT, loggedInAt)
                put(COL_SESSION_IS_ACTIVE, 1)
            }
            val rowId = db.insertWithOnConflict(
                TABLE_SESSIONS, null, values, SQLiteDatabase.CONFLICT_REPLACE
            )
            db.setTransactionSuccessful()
            rowId
        } finally {
            db.endTransaction()
        }
    }

    /**
     * Returns the currently active session row, or null if no session exists.
     */
    fun getActiveSession(): SessionRecord? {
        val db = readableDatabase
        val cursor = db.query(
            TABLE_SESSIONS,
            null,
            "$COL_SESSION_IS_ACTIVE = ?",
            arrayOf("1"),
            null, null, null
        )
        cursor.use {
            if (it.moveToFirst()) {
                return SessionRecord(
                    id           = it.getLong(it.getColumnIndexOrThrow(COL_ID)),
                    userId       = it.getString(it.getColumnIndexOrThrow(COL_SESSION_USER_ID)) ?: "",
                    username     = it.getString(it.getColumnIndexOrThrow(COL_SESSION_USERNAME)),
                    fullName     = it.getString(it.getColumnIndexOrThrow(COL_SESSION_FULL_NAME)),
                    email        = it.getString(it.getColumnIndexOrThrow(COL_SESSION_EMAIL)),
                    phoneNumber  = it.getString(it.getColumnIndexOrThrow(COL_SESSION_PHONE)) ?: "",
                    role         = it.getString(it.getColumnIndexOrThrow(COL_SESSION_ROLE)),
                    status       = it.getString(it.getColumnIndexOrThrow(COL_SESSION_STATUS)),
                    nic          = it.getString(it.getColumnIndexOrThrow(COL_SESSION_NIC)),
                    address      = it.getString(it.getColumnIndexOrThrow(COL_SESSION_ADDRESS)),
                    jwtToken     = it.getString(it.getColumnIndexOrThrow(COL_SESSION_JWT)),
                    expiresAt    = it.getString(it.getColumnIndexOrThrow(COL_SESSION_EXPIRES_AT)) ?: "",
                    loggedInAt   = it.getString(it.getColumnIndexOrThrow(COL_SESSION_LOGGED_IN_AT)),
                    isActiveSession = true
                )
            }
        }
        return null
    }

    /**
     * Marks all session rows as inactive (soft logout — preserves history).
     */
    fun clearSession() {
        val db = writableDatabase
        val values = ContentValues().apply { put(COL_SESSION_IS_ACTIVE, 0) }
        db.update(TABLE_SESSIONS, values, null, null)
    }

    /** Returns true if there is an active session row in SQLite. */
    fun isLoggedIn(): Boolean = getActiveSession() != null
}
