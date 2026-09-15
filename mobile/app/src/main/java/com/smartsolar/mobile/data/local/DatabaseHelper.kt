package com.smartsolar.mobile.data.local

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.smartsolar.mobile.data.model.EnergySlot
import com.smartsolar.mobile.data.model.Reservation
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

        db.execSQL(createStationsTable)
        db.execSQL(createSlotsTable)
        db.execSQL(createReservationsTable)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_RESERVATIONS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_SLOTS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_STATIONS")
        onCreate(db)
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
            put(COL_DATE, slot.date)
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
}
