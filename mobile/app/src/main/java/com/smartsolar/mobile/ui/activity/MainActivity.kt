package com.smartsolar.mobile.ui.activity

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.ActionBarDrawerToggle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.google.android.material.navigation.NavigationView
import com.smartsolar.mobile.R
import com.smartsolar.mobile.data.repository.SlotRepository
import com.smartsolar.mobile.data.repository.StationRepository
import com.smartsolar.mobile.databinding.ActivityMainBinding
import com.smartsolar.mobile.ui.fragment.MyReservationsFragment
import com.smartsolar.mobile.ui.fragment.ReservationHistoryFragment
import com.smartsolar.mobile.ui.fragment.ReserveEnergyFragment
import com.smartsolar.mobile.ui.fragment.StationsFragment
import com.smartsolar.mobile.utils.NetworkUtils
import kotlinx.coroutines.launch

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
                showReservationScreen(StationsFragment(), "Microgrid Stations")
            }

            R.id.nav_slots -> {
                showReservationScreen(ReserveEnergyFragment(), "Reserve Energy")
            }

            R.id.nav_reservations -> {
                showReservationScreen(MyReservationsFragment(), "My Reservations")
            }

            R.id.nav_history -> {
                showReservationScreen(ReservationHistoryFragment(), "Reservation History")
            }

            R.id.nav_sync -> {
                lifecycleScope.launch {
                    Toast.makeText(this@MainActivity, "Syncing data with Cloud Backend...", Toast.LENGTH_SHORT).show()
                    val stationRepo = StationRepository(this@MainActivity)
                    val slotRepo = SlotRepository(this@MainActivity)

                    val stationsSync = stationRepo.syncStations()
                    if (stationsSync.isSuccess) {
                        val count = stationsSync.getOrDefault(0)
                        val localStations = stationRepo.getStations(false).getOrDefault(emptyList())
                        val slotsSync = slotRepo.syncAllSlots(localStations)
                        val slotCount = slotsSync.getOrDefault(0)

                        Toast.makeText(
                            this@MainActivity,
                            "✓ Sync Complete: $count stations & $slotCount slots saved to local SQLite",
                            Toast.LENGTH_LONG
                        ).show()
                    } else {
                        val err = stationsSync.exceptionOrNull()?.message ?: "Sync failed"
                        Toast.makeText(this@MainActivity, "⚠ Sync Warning: $err", Toast.LENGTH_LONG).show()
                    }
                }
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

    private fun showReservationScreen(fragment: Fragment, title: String) {
        binding.topToolbar.title = title
        supportFragmentManager.beginTransaction()
            .setCustomAnimations(android.R.anim.fade_in, android.R.anim.fade_out)
            .replace(R.id.fragmentContainer, fragment)
            .commit()
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
