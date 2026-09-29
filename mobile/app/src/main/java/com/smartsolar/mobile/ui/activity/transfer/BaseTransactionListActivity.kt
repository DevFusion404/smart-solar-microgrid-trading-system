package com.smartsolar.mobile.ui.activity.transfer

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.local.DatabaseHelper
import com.smartsolar.mobile.data.model.TransactionResponse
import com.smartsolar.mobile.data.repository.TransactionRepository
import com.smartsolar.mobile.ui.adapter.TransactionAdapter
import kotlinx.coroutines.launch

/**
 * Component 4 - shared behaviour for the four transfer list screens
 * (current, pending, history and search results).
 *
 * Each subclass supplies its own layout, as the module spec requires, but the
 * loading, empty-state, offline-cache and error handling live here so the
 * screens cannot drift apart.
 *
 * Subclass layouts must declare these ids:
 *   toolbarTransactions, recyclerTransactions, progressTransactions, tvEmptyState
 */
abstract class BaseTransactionListActivity : AppCompatActivity() {

    protected val repository by lazy { TransactionRepository() }
    protected lateinit var adapter: TransactionAdapter

    private lateinit var recycler: RecyclerView
    private lateinit var progress: ProgressBar
    private lateinit var emptyState: TextView

    /** Layout to inflate, for example R.layout.activity_current_booking. */
    protected abstract val layoutResId: Int

    /** Toolbar title for this screen. */
    protected abstract val screenTitleRes: Int

    /** Message shown when the API returns nothing. */
    protected open val emptyMessageRes: Int = R.string.transfer_empty_bookings

    /** Fetches the rows this screen shows. */
    protected abstract suspend fun fetchTransactions(): Result<List<TransactionResponse>>

    /** When true, a failed load falls back to the SQLite cache. */
    protected open val useOfflineCache: Boolean = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(layoutResId)

        findViewById<Toolbar>(R.id.toolbarTransactions).apply {
            title = getString(screenTitleRes)
            setNavigationOnClickListener { finish() }
        }

        recycler = findViewById(R.id.recyclerTransactions)
        progress = findViewById(R.id.progressTransactions)
        emptyState = findViewById(R.id.tvEmptyState)

        adapter = TransactionAdapter(onTransactionClick = ::onTransactionSelected)
        recycler.layoutManager = LinearLayoutManager(this)
        recycler.adapter = adapter

        loadTransactions()
    }

    /** Subclasses override to react to a tapped row. Ignored by default. */
    protected open fun onTransactionSelected(transaction: TransactionResponse) = Unit

    /** Reloads the list; call after an action changes server state. */
    protected fun loadTransactions() {
        showLoading(true)
        lifecycleScope.launch {
            val result = fetchTransactions()
            showLoading(false)

            result.onSuccess { transactions ->
                render(transactions)
                if (useOfflineCache && transactions.isNotEmpty()) {
                    DatabaseHelper(this@BaseTransactionListActivity).use { db ->
                        db.cacheTransactions(transactions)
                    }
                }
            }.onFailure { error ->
                val cached = if (useOfflineCache) readCache() else emptyList()
                if (cached.isNotEmpty()) {
                    render(cached)
                    showMessage(getString(R.string.transfer_showing_cached))
                } else {
                    render(emptyList())
                    showMessage(error.message ?: getString(R.string.transfer_error_offline))
                }
            }
        }
    }

    private fun render(transactions: List<TransactionResponse>) {
        adapter.submitTransactions(transactions)
        val isEmpty = transactions.isEmpty()
        emptyState.visibility = if (isEmpty) View.VISIBLE else View.GONE
        recycler.visibility = if (isEmpty) View.GONE else View.VISIBLE
        if (isEmpty) emptyState.text = getString(emptyMessageRes)
    }

    private fun readCache(): List<TransactionResponse> =
        DatabaseHelper(this).use { db -> db.getCachedTransactions() }

    private fun showLoading(isLoading: Boolean) {
        progress.visibility = if (isLoading) View.VISIBLE else View.GONE
        if (isLoading) {
            emptyState.visibility = View.GONE
        }
    }

    protected fun showMessage(message: String) {
        emptyState.visibility = View.VISIBLE
        emptyState.text = message
    }
}
