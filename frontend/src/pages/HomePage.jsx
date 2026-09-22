/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Landing / Home Page
File          : HomePage.jsx
Description   : High-tech landing page highlighting solar panel
                microgrid energy trading, live grid stats,
                features, and seamless portal navigation.
=====================================================
*/

import { 
  Sun, Moon, Zap, Shield, Activity, BatteryCharging, 
  ArrowRight, CheckCircle2, UserCheck, Layers, Cpu, LogIn
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoImg from '../assets/logo3.png'
import solarHeroImg from '../assets/solar_panel_hero.png'
import solar3dImg from '../assets/solar_microgrid_3d.png'

export function HomePage() {
  const navigate = useNavigate()
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
    <div className="home-root">
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="home-navbar">
        <div className="home-nav-container">
          <div className="home-logo-wrap" onClick={() => navigate('/')}>
            <img src={logoImg} alt="SolarGrid" className="home-logo-img" />
            <div className="home-logo-text">
              <span className="logo-title">SolarGrid</span>
              <span className="logo-tag">Microgrid Trading</span>
            </div>
          </div>

          <nav className="home-nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#telemetry" className="nav-link">Microgrid Stats</a>
            <a href="#portals" className="nav-link">Role Portals</a>
          </nav>

          <div className="home-nav-actions">
            <button
              type="button"
              id="home-theme-toggle"
              onClick={() => setIsDark((v) => !v)}
              className="theme-toggle-btn"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              id="home-login-btn"
              onClick={() => navigate('/login')}
              className="home-btn-secondary"
            >
              <LogIn size={16} />
              Sign In
            </button>
            <button
              type="button"
              id="home-register-btn"
              onClick={() => navigate('/register')}
              className="home-btn-primary"
            >
              Register Prosumer
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="home-hero-section">
        <div className="home-hero-glow" />
        <div className="home-container hero-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <Zap size={14} className="text-amber-400" />
              <span>Next-Gen Clean Energy Trading</span>
            </div>
            <h1 className="hero-title">
              Empowering Smart <span className="text-gradient">Solar Microgrids</span> with P2P Energy Trading
            </h1>
            <p className="hero-description">
              Connect your rooftop solar panels to local microgrid nodes. Trade excess clean photovoltaic energy in real-time, optimize storage, and reduce grid dependency.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                id="hero-get-started"
                onClick={() => navigate('/register')}
                className="hero-primary-btn"
              >
                <span>Join as Prosumer</span>
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                id="hero-operator-link"
                onClick={() => navigate('/operator')}
                className="hero-secondary-btn"
              >
                <span>Grid Operator Portal</span>
              </button>
              <button
                type="button"
                id="hero-backoffice-link"
                onClick={() => navigate('/backoffice')}
                className="hero-tertiary-btn"
              >
                <span>Backoffice Admin</span>
              </button>
            </div>

            <div className="hero-highlights">
              <div className="highlight-item">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Zero Carbon Energy</span>
              </div>
              <div className="highlight-item">
                <CheckCircle2 size={16} className="text-cyan-400" />
                <span>Automated Slot Reservations</span>
              </div>
              <div className="highlight-item">
                <CheckCircle2 size={16} className="text-amber-400" />
                <span>Real-Time Node Telemetry</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-img-card">
              <img src={solarHeroImg} alt="Solar Panel Microgrid Farm" className="hero-main-img" />
              <div className="hero-img-overlay" />
              
              {/* Floating 3D Microgrid Inset */}
              <div className="hero-inset-card">
                <img src={solar3dImg} alt="Microgrid Station 3D" className="inset-img" />
                <div className="inset-info">
                  <div className="inset-title">
                    <Activity size={14} className="text-emerald-400 animate-pulse" />
                    <span>Microgrid Node #04</span>
                  </div>
                  <div className="inset-stat">Output: <strong>4.8 kW</strong></div>
                  <div className="inset-badge">Active P2P Flow</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Telemetry Bar ─────────────────────────────────────────────────── */}
      <section id="telemetry" className="home-stats-bar">
        <div className="home-container stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap bg-amber-500/10 text-amber-400">
              <Sun size={24} />
            </div>
            <div>
              <div className="stat-value">14.8 MWh</div>
              <div className="stat-label">Total Solar Generation</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap bg-cyan-500/10 text-cyan-400">
              <Zap size={24} />
            </div>
            <div>
              <div className="stat-value">1,420 kWh</div>
              <div className="stat-label">P2P Energy Traded Today</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap bg-emerald-500/10 text-emerald-400">
              <BatteryCharging size={24} />
            </div>
            <div>
              <div className="stat-value">98.4%</div>
              <div className="stat-label">Microgrid Storage Health</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap bg-indigo-500/10 text-indigo-400">
              <Shield size={24} />
            </div>
            <div>
              <div className="stat-value">100%</div>
              <div className="stat-label">Uptime & Node Balance</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────────────────── */}
      <section id="features" className="home-features-section">
        <div className="home-container">
          <div className="section-header">
            <h2 className="section-title">Built for Modern Microgrid Networks</h2>
            <p className="section-subtitle">
              Comprehensive tools for prosumers, grid operators, and administrative management.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon bg-amber-500/10 text-amber-400">
                <Sun size={24} />
              </div>
              <h3 className="feature-title">Photovoltaic Solar Tracking</h3>
              <p className="feature-text">
                Monitor real-time energy production from solar panels, inverter metrics, and generation yields across nodes.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon bg-cyan-500/10 text-cyan-400">
                <Zap size={24} />
              </div>
              <h3 className="feature-title">Peer-to-Peer Energy Trading</h3>
              <p className="feature-text">
                Directly sell surplus solar electricity to nearby prosumers or consumers with automated dynamic pricing algorithms.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon bg-emerald-500/10 text-emerald-400">
                <Layers size={24} />
              </div>
              <h3 className="feature-title">Energy Slot Reservations</h3>
              <p className="feature-text">
                Reserve energy slots in advance during high-yield solar periods to ensure guaranteed power supply and cost savings.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon bg-indigo-500/10 text-indigo-400">
                <Cpu size={24} />
              </div>
              <h3 className="feature-title">Smart Node Management</h3>
              <p className="feature-text">
                Grid Operators can configure microgrid node schedules, regulate voltage thresholds, and monitor load balancing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Role Portals Section ──────────────────────────────────────────── */}
      <section id="portals" className="home-portals-section">
        <div className="home-container">
          <div className="section-header">
            <h2 className="section-title">Select Your System Portal</h2>
            <p className="section-subtitle">Navigate directly to your workspace based on your registered role</p>
          </div>

          <div className="portals-grid">
            {/* Prosumer Card */}
            <div className="portal-card">
              <div className="portal-badge prosumer-badge">Prosumer</div>
              <h3 className="portal-title">Prosumer Portal</h3>
              <p className="portal-desc">
                For solar panel owners. Track rooftop generation, manage energy sales, view earnings, and update your profile.
              </p>
              <button
                type="button"
                onClick={() => navigate('/prosumer/profile')}
                className="portal-btn prosumer-btn"
              >
                <span>Launch Prosumer Portal</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Grid Operator Card */}
            <div className="portal-card">
              <div className="portal-badge operator-badge">Grid Operator</div>
              <h3 className="portal-title">Grid Operator Console</h3>
              <p className="portal-desc">
                For microgrid technical engineers. Inspect node health, manage energy slot schedules, and resolve network alerts.
              </p>
              <button
                type="button"
                onClick={() => navigate('/operator')}
                className="portal-btn operator-btn"
              >
                <span>Launch Operator Console</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Backoffice Admin Card */}
            <div className="portal-card">
              <div className="portal-badge admin-badge">Backoffice</div>
              <h3 className="portal-title">Backoffice Control</h3>
              <p className="portal-desc">
                For system administrators. Approve prosumer registrations, oversee node creation, and access audit logs.
              </p>
              <button
                type="button"
                onClick={() => navigate('/backoffice')}
                className="portal-btn admin-btn"
              >
                <span>Launch Backoffice</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="home-container footer-content">
          <div className="footer-brand">
            <div className="home-logo-wrap">
              <img src={logoImg} alt="SolarGrid" className="home-logo-img" />
              <span className="logo-title">SolarGrid</span>
            </div>
            <p className="footer-tagline">Smart Solar Microgrid Energy Trading Platform</p>
          </div>
          <p className="footer-copy">
            © 2026 SolarGrid · Built for Clean Renewable Microgrids
          </p>
        </div>
      </footer>
    </div>
  )
}
