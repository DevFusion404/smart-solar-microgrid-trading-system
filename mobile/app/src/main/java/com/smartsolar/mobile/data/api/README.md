# API Layer (`data/api`)

This package handles remote HTTP communication and network services with the backend API.

## Planned Files
- **`ApiService.kt`**: Retrofit interface defining REST API endpoints (Stations, Slots, Authentication, Reservations).
- **`RetrofitClient.kt`**: Singleton providing configured Retrofit instance, OkHttpClient with logging interceptors, base URL, and timeouts.
