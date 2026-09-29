package com.smartsolar.mobile.data.api

import com.smartsolar.mobile.data.model.DashboardSummary
import com.smartsolar.mobile.data.model.OperatorDashboard
import com.smartsolar.mobile.data.model.ProsumerDashboard
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * Component 4 — dashboard endpoints backing the prosumer and operator home screens.
 * Created through RetrofitClient.instance so the shared auth interceptor applies.
 */
interface DashboardApiService {

    /** Headline counters. Prosumers always receive their own figures. */
    @GET("api/dashboard/summary")
    suspend fun getSummary(
        @Query("prosumerNic") prosumerNic: String? = null
    ): Response<DashboardSummary>

    /** Full dashboard for the signed-in prosumer, including approved future reservations. */
    @GET("api/dashboard/prosumer")
    suspend fun getMyDashboard(): Response<ProsumerDashboard>

    /** Grid operator dashboard: summary, today's transfers, pending queue, recent completions. */
    @GET("api/dashboard/operator")
    suspend fun getOperatorDashboard(): Response<OperatorDashboard>
}
