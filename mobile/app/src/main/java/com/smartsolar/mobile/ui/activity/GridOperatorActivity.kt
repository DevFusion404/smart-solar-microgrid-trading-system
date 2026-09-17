package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.ActionBarDrawerToggle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import com.google.android.material.navigation.NavigationView
import com.smartsolar.mobile.R
import com.smartsolar.mobile.databinding.ActivityGridOperatorHomeBinding

/**
 * GridOperatorActivity – Screen 8
 * Home screen for users with the Grid Operator role.
 * Uses a Navigation Drawer mirroring MainActivity, with cyan accent styling.
 *
 * Accepts Intent extras:
 *   - "USER_NAME"  → displayed in the drawer header
 *   - "USER_ROLE"  → e.g. "Grid Operator"
 */
class GridOperatorActivity : AppCompatActivity(), NavigationView.OnNavigationItemSelectedListener {

    private lateinit var binding: ActivityGridOperatorHomeBinding
    private lateinit var drawerToggle: ActionBarDrawerToggle

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityGridOperatorHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbarAndDrawer()
        setupUserProfileHeader()
        populateDashboard()
        setupQuickActions()
    }

    private fun setupToolbarAndDrawer() {
        setSupportActionBar(binding.gridOpToolbar)
        supportActionBar?.title = getString(R.string.grid_op_home_title)

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
        val userName = intent.getStringExtra("USER_NAME") ?: getString(R.string.default_user_name)
        val userRole = intent.getStringExtra("USER_ROLE") ?: "Grid Operator"

        val headerView = binding.gridOpNavigationView.getHeaderView(0)
        headerView.findViewById<android.widget.TextView>(R.id.tvNavUserName)?.text = userName
        headerView.findViewById<android.widget.TextView>(R.id.tvNavUserRole)?.text = userRole
        headerView.findViewById<android.widget.TextView>(R.id.tvNavUserInitial)?.text =
            userName.firstOrNull()?.uppercase() ?: "G"

        // Welcome message in the hero
        binding.tvGridOpWelcome.text = "Good day, ${userName.split(" ").firstOrNull() ?: userName}"
    }

    private fun populateDashboard() {
        // Placeholder stats — replace with real ViewModel/repository calls
        binding.tvStatProsumers.text = "—"
        binding.tvStatPending.text = "—"
        binding.tvStatActiveNodes.text = "—"
        binding.tvPendingBadge.text = "0"
    }

    private fun setupQuickActions() {
        binding.cardReviewRequests.setOnClickListener {
            Toast.makeText(this, "Opening Pending Requests…", Toast.LENGTH_SHORT).show()
            // TODO: Navigate to ReviewRequestsFragment or Activity
        }

        binding.cardManageNodes.setOnClickListener {
            Toast.makeText(this, "Opening Node Management…", Toast.LENGTH_SHORT).show()
            // TODO: Navigate to ManageNodesFragment or Activity
        }

        binding.cardViewReports.setOnClickListener {
            Toast.makeText(this, "Opening Reports…", Toast.LENGTH_SHORT).show()
            // TODO: Navigate to ReportsFragment or Activity
        }
    }

    override fun onNavigationItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.nav_profile -> {
                binding.gridOpToolbar.title = "My Account"
                supportFragmentManager.beginTransaction()
                    .setCustomAnimations(android.R.anim.fade_in, android.R.anim.fade_out)
                    .replace(R.id.gridOpFragmentContainer, com.smartsolar.mobile.ui.fragment.ProfileFragment())
                    .addToBackStack(null)
                    .commit()
            }
            R.id.nav_settings -> {
                startActivity(Intent(this, SettingsActivity::class.java))
            }
            R.id.nav_logout -> {
                val intent = Intent(this, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                finish()
                return true
            }
            else -> {
                Toast.makeText(this, "Coming soon", Toast.LENGTH_SHORT).show()
            }
        }
        binding.gridOpDrawerLayout.closeDrawer(GravityCompat.START)
        return true
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (binding.gridOpDrawerLayout.isDrawerOpen(GravityCompat.START)) {
            binding.gridOpDrawerLayout.closeDrawer(GravityCompat.START)
        } else {
            super.onBackPressed()
        }
    }
}
