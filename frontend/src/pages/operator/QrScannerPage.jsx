/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : QrScannerPage.jsx
Description   : Grid operator QR scanner page. Reads the prosumer's
                QR through the device camera, sends the token to the
                verification API, and shows the result
Author        : Malmi
=====================================================
*/

import { AlertTriangle, ArrowLeft, Camera, CameraOff, CheckCircle2, Keyboard } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { transactionService } from '../../services'
import {
  ErrorBanner,
  TransactionStatusPill,
  formatDate,
  formatEnergy,
} from '../../components/transactions/TransactionUi'

/** DOM id the html5-qrcode library mounts its video preview into. */
const SCANNER_ELEMENT_ID = 'energy-qr-scanner'

/**
 * Camera-based QR scanner for grid operators.
 * A manual entry box sits alongside the camera so the flow still works on a
 * desktop machine, or when a prosumer's screen is too dim to read.
 */
export function QrScannerPage() {
  const navigate = useNavigate()

  const scannerRef = useRef(null)
  const isScanningRef = useRef(false)

  const [cameraOn, setCameraOn] = useState(false)
  const [manualToken, setManualToken] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  /**
   * Sends a token to the verification API and stores the outcome.
   * @param {string} token - Raw token or full QR payload
   */
  const verifyToken = async (token) => {
    if (!token || verifying) return

    try {
      setVerifying(true)
      setError('')
      const response = await transactionService.verifyQr(token)
      setResult(response)
    } catch (err) {
      setError(err.message || 'Could not verify this QR code.')
    } finally {
      setVerifying(false)
    }
  }

  // Stops the camera and releases the video stream.
  const stopCamera = async () => {
    const scanner = scannerRef.current

    if (scanner && isScanningRef.current) {
      try {
        await scanner.stop()
        scanner.clear()
      } catch {
        // Already stopped — nothing further to release.
      }
      isScanningRef.current = false
    }

    setCameraOn(false)
  }

  // Starts the rear camera and begins decoding frames.
  const startCamera = async () => {
    try {
      setError('')
      setResult(null)
      setCameraOn(true)

      // The container must be in the DOM before the library attaches to it.
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          // One scan is enough: stop before verifying so the camera does not
          // fire the same token repeatedly while the request is in flight.
          await stopCamera()
          await verifyToken(decodedText)
        },
        () => {
          // Per-frame decode misses are normal and deliberately ignored.
        },
      )

      isScanningRef.current = true
    } catch (err) {
      setCameraOn(false)
      setError(
        err?.message
          ? `Could not start the camera: ${err.message}. Use manual entry instead.`
          : 'Could not start the camera. Use manual entry instead.',
      )
    }
  }

  // Release the camera if the operator navigates away mid-scan.
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current
      if (scanner && isScanningRef.current) {
        scanner.stop().catch(() => {})
      }
    }
  }, [])

  const details = result?.transactionDetails

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate('/operator/transfers')}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to transfers
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">QR Scanner</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Scan the prosumer's QR code to verify their booking before releasing energy.
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Scanner ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Camera</h2>

          <div
            id={SCANNER_ELEMENT_ID}
            className="mt-4 flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950"
          >
            {!cameraOn && (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-slate-400">
                <CameraOff className="h-8 w-8" />
                <p className="text-xs">The camera is off.</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={cameraOn ? stopCamera : startCamera}
            className={
              cameraOn
                ? 'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                : 'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-amber-400'
            }
          >
            {cameraOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {cameraOn ? 'Stop camera' : 'Start camera'}
          </button>

          {/* Manual fallback keeps the workflow usable without a camera. */}
          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
            <label
              htmlFor="manual-token"
              className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              <Keyboard className="h-3.5 w-3.5" />
              Or enter the token manually
            </label>

            <div className="mt-2 flex gap-2">
              <input
                id="manual-token"
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste the QR token"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => verifyToken(manualToken.trim())}
                disabled={!manualToken.trim() || verifying}
                className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </section>

        {/* ── Result ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Scan result</h2>

          {!result && (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Scan a code or enter a token to see the booking details here.
            </p>
          )}

          {result && !result.success && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                    {result.message}
                  </p>
                  {result.errorCode && (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">Code: {result.errorCode}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {result?.success && details && (
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-400/10">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  {result.message}
                </p>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Prosumer</dt>
                  <dd className="text-right font-medium text-slate-900 dark:text-white">
                    {details.prosumerName || details.prosumerNIC}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Station</dt>
                  <dd className="text-right font-medium text-slate-900 dark:text-white">
                    {details.stationName || details.stationId}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Energy</dt>
                  <dd className="text-right font-medium text-slate-900 dark:text-white">
                    {formatEnergy(details.energyAmount)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Booking</dt>
                  <dd className="text-right font-medium text-slate-900 dark:text-white">
                    {formatDate(details.slotDate)} · {details.slotTime}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Status</dt>
                  <dd>
                    <TransactionStatusPill status={details.transferStatus} />
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => navigate(`/operator/transfers/${details.transactionId}/verify`)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Continue to verification
              </button>
            </div>
          )}

          {result && (
            <button
              type="button"
              onClick={() => {
                setResult(null)
                setManualToken('')
              }}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Scan another code
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
