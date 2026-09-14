# Data Models (`data/model`)

This package contains data classes representing domain entities and DTOs exchanged with the backend.

## Planned Files
- **`Station.kt`**: Data model representing a solar microgrid station (stationId, name, location, capacity, operational schedule, status).
- **`EnergySlot.kt`**: Data model representing an energy booking time slot (slotId, stationId, date, time range, total/available capacity, status).
- **`Reservation.kt`**: Data model for energy booking reservations and user transactions.
