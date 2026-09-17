package com.smartsolar.mobile.ui.fragment.operator

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.smartsolar.mobile.R
import com.smartsolar.mobile.databinding.FragmentOperatorBookingsBinding
import com.smartsolar.mobile.ui.activity.GridOperatorActivity

class OperatorBookingsFragment : Fragment() {

    private var _binding: FragmentOperatorBookingsBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOperatorBookingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnBackToDashboardFromBookings.setOnClickListener {
            (activity as? GridOperatorActivity)?.navigateToTab(R.id.nav_grid_dashboard)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
