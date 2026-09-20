package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import androidx.appcompat.app.ActionBarDrawerToggle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.fragment.app.Fragment
import com.google.android.material.navigation.NavigationView
import com.smartsolar.mobile.R
import com.smartsolar.mobile.databinding.ActivityGridOperatorHomeBinding
import com.smartsolar.mobile.ui.fragment.ProfileFragment
import com.smartsolar.mobile.ui.fragment.operator.GridOperatorDashboardFragment
import com.smartsolar.mobile.ui.fragment.operator.OperatorBookingsFragment
import com.smartsolar.mobile.ui.fragment.operator.OperatorNodesFragment
import com.smartsolar.mobile.ui.fragment.operator.OperatorSlotsFragment

/**
 * GridOperatorActivity – Screen 8
 * Dedicated portal for Grid Operators.
 * Manages assigned microgrid nodes, node details, battery availability, and energy slot control.
 */
class GridOperatorActivity : AppCompatActivity(), NavigationView.OnNavigationItemSelectedListener {

    private lateinit var binding: ActivityGridOperatorHomeBinding
    private lateinit var drawerToggle: ActionBarDrawerToggle

    // Shared state between fragments (e.g. When clicking 'Manage Slots' from My Nodes)
    var preselectedStationId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityGridOperatorHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Ensure Retrofit token is actively restored from SQLite session
        if (com.smartsolar.mobile.data.api.RetrofitClient.authToken.isNullOrBlank()) {
            com.smartsolar.mobile.data.api.RetrofitClient.authToken =
                com.smartsolar.mobile.data.local.SessionManager.getToken(this)
        }

        setupToolbarAndDrawer()
        setupUserProfileHeader()

        if (savedInstanceState == null) {
            navigateToTab(R.id.nav_grid_dashboard)
        }
    }

    private fun setupToolbarAndDrawer() {
        setSupportActionBar(binding.gridOpToolbar)
        supportActionBar?.title = "Operator Dashboard"

        drawerToggle = ActionBarDrawerToggle(
            this,
            binding.gridOpDrawerLayout,
            binding.gridOpToolbar,
            R.string.app_name,
            R.string.app_name
        )
        binding.gridOpDrawerLayout.addDrawerListener(drawerToggle)
        drawerToggle.syncState()

        binding.gridOpToolbar.setNavigationOnClickListener {
            binding.gridOpDrawerLayout.openDrawer(GravityCompat.START)
        }

        binding.gridOpNavigationView.setNavigationItemSelectedListener(this)
    }

    private fun setupUserProfileHeader() {
        val userName = intent.getStringExtra("USER_NAME")
            ?: com.smartsolar.mobile.data.local.SessionManager.getDisplayName(this)
            ?: com.smartsolar.mobile.data.local.SessionManager.getUsername(this)
            ?: "Operator"
        val userRole = intent.getStringExtra("USER_ROLE") ?: "Grid Operator"

        val headerView = binding.gridOpNavigationView.getHeaderView(0)
        headerView.findViewById<android.widget.TextView>(R.id.tvNavUserName)?.text = userName
        headerView.findViewById<android.widget.TextView>(R.id.tvNavUserRole)?.text = userRole
        headerView.findViewById<android.widget.TextView>(R.id.tvNavUserInitial)?.text =
            userName.firstOrNull()?.uppercase() ?: "O"
    }

    override fun onNavigationItemSelected(item: MenuItem): Boolean {
        navigateToTab(item.itemId)
        binding.gridOpDrawerLayout.closeDrawer(GravityCompat.START)
        return true
    }

    fun navigateToTab(itemId: Int) {
        val fragment: Fragment
        val title: String

        when (itemId) {
            R.id.nav_grid_dashboard -> {
                fragment = GridOperatorDashboardFragment()
                title = "Operator Dashboard"
            }
            R.id.nav_grid_nodes -> {
                fragment = OperatorNodesFragment()
                title = "My Assigned Nodes"
            }
            R.id.nav_grid_slots -> {
                fragment = OperatorSlotsFragment()
                title = "Energy Slots Control"
            }
            R.id.nav_grid_bookings -> {
                fragment = OperatorBookingsFragment()
                title = "Bookings & Telemetry"
            }
            R.id.nav_grid_profile -> {
                fragment = ProfileFragment()
                title = "Operator Profile"
            }
            R.id.nav_grid_logout -> {
                com.smartsolar.mobile.data.local.SessionManager.clearSession(this)
                val intent = Intent(this, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                finish()
                return
            }
            else -> {
                fragment = GridOperatorDashboardFragment()
                title = "Operator Dashboard"
            }
        }

        binding.gridOpToolbar.title = title
        binding.gridOpNavigationView.setCheckedItem(itemId)

        supportFragmentManager.beginTransaction()
            .setCustomAnimations(android.R.anim.fade_in, android.R.anim.fade_out)
            .replace(R.id.gridOpFragmentContainer, fragment)
            .commit()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (binding.gridOpDrawerLayout.isDrawerOpen(GravityCompat.START)) {
            binding.gridOpDrawerLayout.closeDrawer(GravityCompat.START)
        } else {
            val currentFragment = supportFragmentManager.findFragmentById(R.id.gridOpFragmentContainer)
            if (currentFragment !is GridOperatorDashboardFragment) {
                navigateToTab(R.id.nav_grid_dashboard)
            } else {
                super.onBackPressed()
            }
        }
    }
}
