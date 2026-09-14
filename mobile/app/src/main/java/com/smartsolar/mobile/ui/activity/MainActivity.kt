package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.ActionBarDrawerToggle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import com.google.android.material.navigation.NavigationView
import com.smartsolar.mobile.R
import com.smartsolar.mobile.databinding.ActivityMainBinding
import com.smartsolar.mobile.utils.NetworkUtils

class MainActivity : AppCompatActivity(), NavigationView.OnNavigationItemSelectedListener {

    private lateinit var binding: ActivityMainBinding
    private lateinit var drawerToggle: ActionBarDrawerToggle

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbarAndDrawer()
        setupUserProfileHeader()
        setupBackPressHandler()
    }

    /**
     * Dynamically updates the user name, role, and avatar initial in the drawer header.
     * Can be passed via Intent extras ("USER_NAME", "USER_ROLE") or loaded from user session.
     */
    private fun setupUserProfileHeader() {
        val userName = intent.getStringExtra("USER_NAME") ?: getString(R.string.default_user_name)
        val userRole = intent.getStringExtra("USER_ROLE") ?: getString(R.string.default_user_role)

        val headerView = binding.navigationView.getHeaderView(0)
        val tvName = headerView.findViewById<android.widget.TextView>(R.id.tvNavUserName)
        val tvRole = headerView.findViewById<android.widget.TextView>(R.id.tvNavUserRole)
        val tvInitial = headerView.findViewById<android.widget.TextView>(R.id.tvNavUserInitial)

        tvName?.text = userName
        tvRole?.text = userRole
        tvInitial?.text = userName.firstOrNull()?.uppercase() ?: "U"
    }

    private fun setupToolbarAndDrawer() {
        setSupportActionBar(binding.topToolbar)

        // Setup Drawer Toggle
        drawerToggle = ActionBarDrawerToggle(
            this,
            binding.drawerLayout,
            binding.topToolbar,
            R.string.app_name,
            R.string.app_name
        )
        binding.drawerLayout.addDrawerListener(drawerToggle)
        drawerToggle.syncState()

        // Hamburger button click opens drawer from left
        binding.topToolbar.setNavigationOnClickListener {
            binding.drawerLayout.openDrawer(GravityCompat.START)
        }

        // Navigation item click listener
        binding.navigationView.setNavigationItemSelectedListener(this)
    }

    override fun onNavigationItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.nav_home -> {
                binding.topToolbar.title = "Home"
                binding.tvCurrentScreenTitle.text = "Solar Home Dashboard"
                binding.tvScreenDescription.text = "Overview of microgrid trading, active bookings, and solar production."
            }

            R.id.nav_stations -> {
                binding.topToolbar.title = "Microgrid Stations"
                binding.tvCurrentScreenTitle.text = "Microgrid Stations"
                binding.tvScreenDescription.text = "Browse, search, and view live stations across the community grid."
                Toast.makeText(this, "Opening Microgrid Stations…", Toast.LENGTH_SHORT).show()
            }

            R.id.nav_slots -> {
                binding.topToolbar.title = "Energy Slots"
                binding.tvCurrentScreenTitle.text = "Energy Booking Slots"
                binding.tvScreenDescription.text = "Select time slots and trade available renewable solar capacity."
                Toast.makeText(this, "Opening Energy Slots…", Toast.LENGTH_SHORT).show()
            }

            R.id.nav_reservations -> {
                binding.topToolbar.title = "My Reservations"
                binding.tvCurrentScreenTitle.text = "My Reservations"
                binding.tvScreenDescription.text = "Track your confirmed and pending energy slot bookings."
                Toast.makeText(this, "Opening Reservations…", Toast.LENGTH_SHORT).show()
            }

            R.id.nav_history -> {
                binding.topToolbar.title = "Energy History"
                binding.tvCurrentScreenTitle.text = "Energy Trading History"
                binding.tvScreenDescription.text = "Review your historical energy consumption and solar credit sales."
                Toast.makeText(this, "Opening Energy History…", Toast.LENGTH_SHORT).show()
            }

            R.id.nav_sync -> {
                val isOnline = NetworkUtils.isNetworkAvailable(this)
                val statusMessage = if (isOnline) {
                    "✓ Local SQLite database is synced with Cloud Backend"
                } else {
                    "⚠ Working Offline — Changes will sync when connected"
                }
                Toast.makeText(this, statusMessage, Toast.LENGTH_LONG).show()
            }

            R.id.nav_settings -> {
                binding.topToolbar.title = "Settings"
                binding.tvCurrentScreenTitle.text = "System Settings"
                binding.tvScreenDescription.text = "Configure notifications, server base URL, and account preferences."
                Toast.makeText(this, "Opening Settings…", Toast.LENGTH_SHORT).show()
            }

            R.id.nav_logout -> {
                Toast.makeText(this, "Signed out successfully", Toast.LENGTH_SHORT).show()
                val intent = Intent(this, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                finish()
                return true
            }
        }

        // Close drawer smoothly after selection
        binding.drawerLayout.closeDrawer(GravityCompat.START)
        return true
    }

    private fun setupBackPressHandler() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.drawerLayout.isDrawerOpen(GravityCompat.START)) {
                    binding.drawerLayout.closeDrawer(GravityCompat.START)
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }
}
