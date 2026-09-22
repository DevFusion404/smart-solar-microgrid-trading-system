/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : 3D Solar Grid Auth Layout
File          : AuthLayout.jsx
Description   : High-tech Solar Panel Microgrid background with
                photovoltaic farm graphics, energy flow animations,
                live node metrics, and glassmorphism card.
=====================================================
*/

import { Moon, Sun, Zap, SunMedium, BatteryCharging, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
import logoImg from '../../assets/logo3.png'
import solarHeroImg from '../../assets/solar_panel_hero.png'
import solar3dImg from '../../assets/solar_microgrid_3d.png'

function SolarGridGraphic() {
  return (
    <div
      aria-hidden="true"
      className="solar-grid-bg"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#040d1a',
      }}
    >
      {/* Background Solar Farm Image with Gradient Mask */}
      <div className="solar-hero-img-wrap">
        <img src={solarHeroImg} alt="Solar Panel Grid" className="solar-hero-img" />
        <div className="solar-hero-overlay" />
      </div>

      {/* Cybernetic Energy Mesh Grid Overlay */}
      <div className="energy-mesh-grid" />

      {/* Glowing Energy Node Lines */}
      <div className="energy-line line-1" />
      <div className="energy-line line-2" />
      <div className="energy-line line-3" />

      {/* Pulsing Microgrid Nodes */}
      <div className="grid-node node-1">
        <div className="node-pulse" />
        <span className="node-label">Node Alpha · 2.4 kW</span>
      </div>
      <div className="grid-node node-2">
        <div className="node-pulse" />
        <span className="node-label">Node Beta · 3.1 kW</span>
      </div>
      <div className="grid-node node-3">
        <div className="node-pulse" />
        <span className="node-label">Battery Station · 92%</span>
      </div>

      {/* 3D Solar Microgrid Glass Visual Card */}
      <div className="solar-3d-card-wrap">
        <div className="solar-3d-card">
          <img src={solar3dImg} alt="3D Solar Microgrid Node" className="solar-3d-img" />
          <div className="solar-3d-glow" />
        </div>
      </div>

      {/* Brand & Live Telemetry Overlay */}
      <div className="brand-overlay">
        <div className="brand-header">
          <div className="brand-logo-wrap">
            <img src={logoImg} alt="SolarGrid" className="brand-logo-img" />
          </div>
          <div>
            <h2 className="brand-title">SolarGrid</h2>
            <p className="brand-subtitle">Smart Solar Microgrid Energy Trading</p>
          </div>
        </div>

        <div className="solar-metrics-chips">
          <div className="metric-chip">
            <SunMedium size={14} className="text-amber-400" />
            <span>Solar Yield: <strong>14.2 kWh</strong></span>
          </div>
          <div className="metric-chip">
            <Zap size={14} className="text-cyan-400" />
            <span>P2P Price: <strong>$0.14 / kWh</strong></span>
          </div>
          <div className="metric-chip">
            <BatteryCharging size={14} className="text-emerald-400" />
            <span>Grid Storage: <strong>92%</strong></span>
          </div>
          <div className="metric-chip">
            <Activity size={14} className="text-indigo-400" />
            <span>Grid Freq: <strong>50.0 Hz</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthLayout({ children }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('theme')
    return saved !== null ? saved === 'dark' : true
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <main id="auth-root" className="auth-root">
      {/* Left: 3D Solar Microgrid Visual Scene */}
      <section className="auth-scene-panel" aria-hidden="true">
        <SolarGridGraphic />
      </section>

      {/* Right: Glassmorphism Form Panel */}
      <section className="auth-form-panel">
        <button
          type="button"
          id="theme-toggle-btn"
          onClick={() => setIsDark((v) => !v)}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="theme-toggle-btn"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="auth-card">
          {children}
        </div>

        <p className="auth-footer">
          © 2026 SolarGrid · Smart Solar Microgrid Energy Trading System
        </p>
      </section>
    </main>
  )
}
