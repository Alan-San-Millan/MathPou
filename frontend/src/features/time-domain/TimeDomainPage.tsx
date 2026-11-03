import { useEffect, useMemo, useRef, useState } from 'react'
import { postPulse, type Reconstruction } from '../../shared/api/client'
import { SignalExpression } from './SignalExpression'
import { attachTimeDomainPlot, IDEAL_COLOR, RECONSTRUCTION_COLOR } from './timeDomainPlot'
import './time-domain.css'

type Pulse = { id: number; ti: string; tf: string; amp: string }
type ValidPulse = { k: number; ti: number; tf: number; amp: number }
type Series = { time: number[]; signal: number[] }

const DEFAULT_HARMONICS = '50'
const MAX_HARMONICS = 3000

// Ajusta la suma parcial a0/2 + Σ (an cos nω0t + bn sin nω0t) de `from` a `to` armónicos,
// sumando o restando solo los términos que cambian, para que el slider responda al instante.
function shiftPartialSum(rec: Reconstruction, w0: number, base: number[], from: number, to: number): number[] {
  const signal = base.slice()
  const sign = to > from ? 1 : -1
  for (let n = Math.min(from, to) + 1; n <= Math.max(from, to); n++) {
    const an = sign * rec.an[n - 1]
    const bn = sign * rec.bn[n - 1]
    const w = n * w0
    for (let i = 0; i < signal.length; i++) {
      const t = rec.time[i]
      signal[i] += an * Math.cos(w * t) + bn * Math.sin(w * t)
    }
  }
  return signal
}
const BASE_PULSES = 4
const MAX_PULSES = 10

let nextPulseId = 0
function emptyPulse(): Pulse {
  nextPulseId += 1
  return { id: nextPulseId, ti: '', tf: '', amp: '' }
}

function basePulses(): Pulse[] {
  return Array.from({ length: BASE_PULSES }, emptyPulse)
}

function parsePulses(pulses: Pulse[]): { valid: ValidPulse[]; ignored: number[]; error?: string } {
  const valid: ValidPulse[] = []
  const ignored: number[] = []
  for (const [index, pulse] of pulses.entries()) {
    const k = index + 1
    const fields = [pulse.ti, pulse.tf, pulse.amp].map((value) => value.trim())
    const filled = fields.filter((value) => value !== '').length
    if (filled === 0) continue
    if (filled < 3) {
      ignored.push(k)
      continue
    }
    const [ti, tf, amp] = fields.map(Number)
    if ([ti, tf, amp].some((value) => !Number.isFinite(value))) {
      return { valid, ignored, error: `El pulso ${k} tiene valores no numéricos.` }
    }
    if (tf <= ti) {
      return { valid, ignored, error: `En el pulso ${k}, tf (${tf}) debe ser mayor que ti (${ti}).` }
    }
    const previous = valid[valid.length - 1]
    if (previous && ti < previous.tf) {
      return {
        valid,
        ignored,
        error: `El ti del pulso ${k} (${ti}) no puede ser menor que el tf del pulso ${previous.k} (${previous.tf}).`,
      }
    }
    valid.push({ k, ti, tf, amp })
  }
  return { valid, ignored }
}

// Formato del API: [[0, t0], [A1, t1], …], donde Aₖ vale entre tₖ₋₁ y tₖ. Los huecos entre pulsos van con amplitud 0.
function toMatriz(valid: ValidPulse[]): number[][] {
  const matriz: number[][] = [[0, valid[0].ti]]
  for (const pulse of valid) {
    const previousEnd = matriz[matriz.length - 1][1]
    if (pulse.ti > previousEnd) matriz.push([0, pulse.ti])
    matriz.push([pulse.amp, pulse.tf])
  }
  return matriz
}

// Preview local de la escalera. El servidor sigue siendo la fuente de T y ω₀.

function tileSignal(timeArr: number[], signalArr: number[], T: number, repeatsAfter = 3) {
  if (!isFinite(T) || T <= 0) return { time: timeArr, signal: signalArr }
  const outTime: number[] = []
  const outSignal: number[] = []
  for (let r = 0; r <= repeatsAfter; r++) {
    const offset = r * T
    for (let i = 0; i < timeArr.length; i++) {
      outTime.push(timeArr[i] + offset)
      outSignal.push(signalArr[i])
    }
  }
  return { time: outTime, signal: outSignal }
}

function buildPreview(matriz: number[][]) {
  const times = matriz.map((row) => row[1])
  const amps = matriz.slice(1).map((row) => row[0])
  const t0 = times[0]
  const tLast = times[times.length - 1]
  const segments: { start: number; end: number; amp: number }[] = []
  for (let k = 1; k < times.length; k++) {
    if (times[k] > times[k - 1]) {
      segments.push({ start: times[k - 1], end: times[k], amp: amps[k - 1] })
    }
  }
  const baseTime: number[] = []
  const baseSignal: number[] = []
  for (const seg of segments) {
    baseTime.push(seg.start)
    baseSignal.push(seg.amp)
    baseTime.push(seg.end)
    baseSignal.push(seg.amp)
  }
  const Tbase = tLast - t0
  if (isFinite(Tbase) && Tbase > 0) return tileSignal(baseTime, baseSignal, Tbase, 3)
  return { time: baseTime, signal: baseSignal }
}

export function TimeDomainPage() {
  const [pulses, setPulses] = useState<Pulse[]>(basePulses)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [harmonics, setHarmonics] = useState(DEFAULT_HARMONICS)
  const [liveHarmonics, setLiveHarmonics] = useState(0)
  const [result, setResult] = useState<{
    T: number
    w0: number
    matriz: number[][]
    pulses: ValidPulse[]
    harmonics: number
    reconstruction: Reconstruction | null
  } | null>(null)
  const idealHost = useRef<HTMLDivElement | null>(null)
  const reconstructionHost = useRef<HTMLDivElement | null>(null)
  const overlayHost = useRef<HTMLDivElement | null>(null)
  const idealRef = useRef<Series | null>(null)
  const reconstructionRef = useRef<Series | null>(null)
  const plotsRef = useRef<{ redraw: () => void; remove: () => void }[]>([])

  useEffect(() => {
    if (!idealHost.current || !reconstructionHost.current || !overlayHost.current) return undefined
    const ideal = () =>
      idealRef.current ? [{ ...idealRef.current, color: IDEAL_COLOR, step: true, label: 'Ideal' }] : []
    const reconstruction = () =>
      reconstructionRef.current
        ? [{ ...reconstructionRef.current, color: RECONSTRUCTION_COLOR, step: false, label: 'Reconstrucción' }]
        : []
    const both = () => [...ideal(), ...reconstruction()]
    plotsRef.current = [
      attachTimeDomainPlot(idealHost.current, ideal, both),
      attachTimeDomainPlot(reconstructionHost.current, reconstruction, both),
      attachTimeDomainPlot(overlayHost.current, both, both),
    ]
    return () => {
      plotsRef.current.forEach((plot) => plot.remove())
      plotsRef.current = []
    }
  }, [])

  const expressionReconstruction = useMemo(() => {
    if (!result?.reconstruction) return null
    const { an, bn, magnitudes, phi } = result.reconstruction
    const n = result.harmonics
    return {
      ...result.reconstruction,
      an: an.slice(0, n),
      bn: bn.slice(0, n),
      magnitudes: magnitudes.slice(0, n),
      phi: phi.slice(0, n),
    }
  }, [result])

  function changeLiveHarmonics(value: number) {
    setLiveHarmonics(value)
    const current = reconstructionRef.current
    if (!result?.reconstruction || !current) return
    const signal = shiftPartialSum(result.reconstruction, result.w0, current.signal, liveHarmonics, value)
    reconstructionRef.current = { time: current.time, signal }
    redrawPlots()
  }

  function renderHarmonicsSlider(id: string) {
    if (!result?.reconstruction) return null
    return (
      <div className="harmonics-slider">
        <label htmlFor={id}>
          Armónicos en la reconstrucción: <strong>{liveHarmonics}</strong>
        </label>
        <input
          id={id}
          type="range"
          min={1}
          max={MAX_HARMONICS}
          step={1}
          value={liveHarmonics}
          onChange={(e) => changeLiveHarmonics(Number(e.target.value))}
        />
      </div>
    )
  }

  function redrawPlots() {
    plotsRef.current.forEach((plot) => plot.redraw())
  }

  function updatePulse(id: number, field: 'ti' | 'tf' | 'amp', value: string) {
    setPulses((prev) => prev.map((pulse) => (pulse.id === id ? { ...pulse, [field]: value } : pulse)))
  }

  function addPulse() {
    if (pulses.length >= MAX_PULSES) {
      setError(`Se ha alcanzado el límite de ${MAX_PULSES} pulsos.`)
      return
    }
    setError('')
    setPulses((prev) => [...prev, emptyPulse()])
  }

  function removePulse(id: number) {
    setError('')
    setPulses((prev) => prev.filter((pulse) => pulse.id !== id))
  }

  function clearAll() {
    setPulses(basePulses())
    setHarmonics(DEFAULT_HARMONICS)
    setError('')
    setNotice('')
    setResult(null)
    idealRef.current = null
    reconstructionRef.current = null
    redrawPlots()
  }

  async function generate() {
    setError('')
    setNotice('')
    const { valid, ignored, error: pulseError } = parsePulses(pulses)
    if (pulseError) {
      setError(pulseError)
      return
    }
    if (!valid.length) {
      setError('Llena ti, tf y A en al menos un pulso.')
      return
    }
    const ignoredNotice = ignored.length
      ? ` Se ${ignored.length === 1 ? 'ignoró el pulso' : 'ignoraron los pulsos'} ${ignored.join(', ')} porque ${
          ignored.length === 1 ? 'está incompleto' : 'están incompletos'
        }.`
      : ''
    const matriz = toMatriz(valid)

    const harmonicCount = Number(harmonics)
    if (
      harmonics.trim() === '' ||
      !Number.isInteger(harmonicCount) ||
      harmonicCount < 1 ||
      harmonicCount > MAX_HARMONICS
    ) {
      setError(`El número de armónicos debe ser un entero entre 1 y ${MAX_HARMONICS}.`)
      return
    }

    idealRef.current = buildPreview(matriz)
    reconstructionRef.current = null
    redrawPlots()

    setBusy(true)
    try {
      // Se piden siempre MAX_HARMONICS coeficientes para que el slider pueda subir hasta el tope;
      // la curva inicial y la expresión usan solo los primeros harmonicCount.
      const data = await postPulse(matriz, MAX_HARMONICS)
      const full = data.reconstruction ?? null
      reconstructionRef.current = full
        ? {
            time: full.time,
            signal: shiftPartialSum(full, data.w0, full.time.map(() => full.a0 / 2), 0, harmonicCount),
          }
        : null
      redrawPlots()
      setLiveHarmonics(harmonicCount)
      setResult({
        T: data.T,
        w0: data.w0,
        matriz,
        pulses: valid,
        harmonics: harmonicCount,
        reconstruction: full,
      })
      setNotice(`La visualización se ha creado correctamente.${ignoredNotice}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hubo un problema al intentar procesar los datos.')
    } finally {
      setBusy(false)
    }
  }

  const hasGaps = result ? result.matriz.length - 1 > result.pulses.length : false

  return (
    <div className="time-page mp-enter">
      <div className="container">
        <div className="instrucciones-btn-container">
          <button
            id="instrucciones-btn"
            type="button"
            className="mp-press"
            onClick={() => setModalOpen(true)}
            aria-label="Ver instrucciones"
          >
            <i className="uil uil-info-circle" aria-hidden="true" />
          </button>
        </div>
        <div className="form_and_graph">
          <header className="lab-page-header time-header">
            <div>
              <p className="mp-eyebrow">
                <i className="uil uil-clock" aria-hidden="true" /> Dominio del tiempo
              </p>
              <h1>Análisis de Fourier en el dominio del tiempo</h1>
              <p className="mp-lede">
                Define cada pulso con su tiempo inicial t<sub>i</sub>, tiempo final t<sub>f</sub> y amplitud A.
                La vista previa dibuja la escalera; el servidor calcula el periodo T y ω₀.
              </p>
            </div>
            <figure className="pulse-guide">
              <img
                src="/img/figura_pulso.png"
                alt="Guía: señal f(t) con amplitudes A1, A2, A3… An entre los tiempos t0, t1, t2, t3"
                width={536}
                height={373}
              />            </figure>
          </header>
          <div className="input-section lab-section mp-lift">
            <div className="section-title">
              <span className="mp-icon-chip" aria-hidden="true">
                <i className="uil uil-sliders-v" />
              </span>
              <span>Parámetros de la señal</span>
            </div>
            <p className="section-help">
              Solo se usan los pulsos con t<sub>i</sub>, t<sub>f</sub> y A llenos; no hace falta llenar los{' '}
              {BASE_PULSES}. El t<sub>i</sub> de un pulso no puede ser menor que el t<sub>f</sub> del anterior; si
              queda un hueco entre pulsos, la señal vale 0 ahí. El periodo va del primer t<sub>i</sub> al último
              t<sub>f</sub>.
            </p>
            <div id="inputs-container">
              <div id="inputs-list" className="pulse-inputs">
                {pulses.map((pulse, index) => (
                  <fieldset className="pulse-card" key={pulse.id}>
                    <legend>
                      Pulso {index + 1}
                      {index >= BASE_PULSES ? (
                        <button
                          type="button"
                          className="pulse-remove mp-press"
                          onClick={() => removePulse(pulse.id)}
                          aria-label={`Quitar pulso ${index + 1}`}
                        >
                          <i className="uil uil-times" aria-hidden="true" /> Quitar
                        </button>
                      ) : null}
                    </legend>
                    <div className="pulse-fields">
                      <div className="input-group">
                        <label htmlFor={`ti-${pulse.id}`}>
                          <i className="uil uil-clock" aria-hidden="true" /> Tiempo inicial t<sub>i</sub>
                        </label>
                        <input
                          id={`ti-${pulse.id}`}
                          type="number"
                          className="tiempo"
                          value={pulse.ti}
                          onChange={(e) => updatePulse(pulse.id, 'ti', e.target.value)}
                          placeholder="Inicio"
                          step="0.1"
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor={`tf-${pulse.id}`}>
                          <i className="uil uil-clock" aria-hidden="true" /> Tiempo final t<sub>f</sub>
                        </label>
                        <input
                          id={`tf-${pulse.id}`}
                          type="number"
                          className="tiempo"
                          value={pulse.tf}
                          onChange={(e) => updatePulse(pulse.id, 'tf', e.target.value)}
                          placeholder="Fin"
                          step="0.1"
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor={`amp-${pulse.id}`}>
                          <i className="uil uil-chart-growth" aria-hidden="true" /> Amplitud A
                        </label>
                        <input
                          id={`amp-${pulse.id}`}
                          type="number"
                          className="amplitud"
                          value={pulse.amp}
                          onChange={(e) => updatePulse(pulse.id, 'amp', e.target.value)}
                          placeholder="Amplitud"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </fieldset>
                ))}
              </div>
              <div className="input-group">
                <label htmlFor="harmonics">
                  <i className="uil uil-wave" aria-hidden="true" /> Número de armónicos (n)
                </label>
                <input
                  id="harmonics"
                  type="number"
                  value={harmonics}
                  onChange={(e) => setHarmonics(e.target.value)}
                  placeholder={`Entero entre 1 y ${MAX_HARMONICS}`}
                  min="1"
                  max={MAX_HARMONICS}
                  step="1"
                />
              </div>
            </div>
            <div className="button-container">
              <button
                type="button"
                className="btn btn-create mp-press"
                onClick={addPulse}
                disabled={pulses.length >= MAX_PULSES}
              >
                <i className="uil uil-plus-circle" aria-hidden="true" /> Agregar pulso
              </button>
              <button
                type="button"
                className={`btn btn-generate mp-press${busy ? ' mp-busy' : ''}`}
                onClick={generate}
                disabled={busy}
              >
                <i className="uil uil-process" aria-hidden="true" /> Generar gráfica
              </button>
              <button type="button" className="btn btn-clear mp-press" onClick={clearAll}>
                <i className="uil uil-trash-alt" aria-hidden="true" /> Limpiar
              </button>
            </div>
            {error ? (
              <p className="error-message" role="alert">
                {error}
              </p>
            ) : null}
            {notice ? <p className="formula-note">{notice}</p> : null}
          </div>

          <div className="formulas-container lab-section">
            <div className="section-title">
              <span className="mp-icon-chip mp-icon-chip--primary" aria-hidden="true">
                <i className="uil uil-sigma" />
              </span>
              <h3>Serie de Fourier de una señal de pulsos generalizada</h3>
            </div>
            <div className="formula-main">
              <img
                src="https://latex.codecogs.com/png.image?\dpi{120}&space;f(t)=\frac{a_0}{2}+\sum_{n=1}^{\infty}(a_n\cos n\omega_0 t+b_n\sin n\omega_0 t)"
                alt="Serie de Fourier: a0/2 más suma de an cos y bn sin"
              />
            </div>
            <p className="formula-note">Donde ω₀ = 2π/T y N es el número de pulsos.</p>
          </div>

          <div className="results-section lab-section">
            <div className="section-title">
              <span className="mp-icon-chip" aria-hidden="true">
                <i className="uil uil-table" />
              </span>
              <span>Función f(t) a reconstruir</span>
            </div>
            <p className="section-help">
              Tras generar, aquí ves cada pulso, su duración, el periodo T y la frecuencia angular ω₀
              que devolvió el API.
            </p>
            <div className="table-scroll">
              <table className="data-table">
                <tbody id="matriz-data">
                  {result ? (
                    <>
                      <tr>
                        <th>Pulso</th>
                        <th>
                          t<sub>i</sub>
                        </th>
                        <th>
                          t<sub>f</sub>
                        </th>
                        <th>Amplitud</th>
                        <th>Ancho o duración</th>
                      </tr>
                      {result.pulses.map((pulse) => (
                        <tr key={pulse.k}>
                          <td>Pulso {pulse.k}</td>
                          <td>{pulse.ti}</td>
                          <td>{pulse.tf}</td>
                          <td>A = {pulse.amp}</td>
                          <td>{(pulse.tf - pulse.ti).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="result-summary" colSpan={5}>
                          <strong>
                            Función de {result.pulses.length} {result.pulses.length === 1 ? 'pulso' : 'pulsos'}
                          </strong>
                          {hasGaps ? <> (los huecos entre pulsos valen 0)</> : null}
                          <br />
                          <strong>Periodo (T):</strong> {result.T.toFixed(4)}
                          <br />
                          <strong>Frecuencia angular (ω₀):</strong> {result.w0.toFixed(4)}
                          <br />
                          <strong>Armónicos usados (n):</strong> {result.harmonics}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td className="empty-state" colSpan={5}>
                        <i className="uil uil-exclamation-triangle" aria-hidden="true" /> No hay datos
                        todavía. Completa los parámetros y pulsa <strong>Generar gráfica</strong>.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="plot-section lab-section">
            <div className="section-title">
              <span className="mp-icon-chip" aria-hidden="true">
                <i className="uil uil-chart-line" />
              </span>
              <span>Visualización de la señal</span>
            </div>
            <p className="section-help">
              Las tres gráficas comparten escala para poder compararlas.{' '}
              <span style={{ color: IDEAL_COLOR, fontWeight: 700 }}>Azul: señal ideal</span>,{' '}
              <span style={{ color: RECONSTRUCTION_COLOR, fontWeight: 700 }}>rojo: reconstrucción</span>.
            </p>
            <h4 className="plot-title">1. Señal ideal</h4>
            <p className="section-help">Escalera periódica construida a partir de tus pulsos.</p>
            <div className="plot-container" ref={idealHost} />
            <h4 className="plot-title">2. Reconstrucción con la serie de Fourier</h4>
            <p className="section-help">
              Suma de a₀/2 y los primeros n armónicos (aₙ cos nω₀t + bₙ sin nω₀t), calculada en el servidor. Mueve el slider para cambiar los armónicos en tiempo real.
            </p>
            <div className="plot-frame">
              {renderHarmonicsSlider('harmonics-slider-reconstruction')}
              <div className="plot-container" ref={reconstructionHost} />
            </div>
            <h4 className="plot-title">3. Ideal y reconstrucción superpuestas</h4>
            <div className="plot-frame">
              {renderHarmonicsSlider('harmonics-slider-overlay')}
              <div className="plot-container" ref={overlayHost} />
            </div>
          </div>

          {result && expressionReconstruction ? (
            <SignalExpression
              matriz={result.matriz}
              T={result.T}
              w0={result.w0}
              harmonics={result.harmonics}
              reconstruction={expressionReconstruction}
            />
          ) : null}
        </div>
      </div>

      {modalOpen ? (
        <div className="modal-overlay" id="instrucciones-modal" style={{ display: 'flex' }} onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <button className="close-modal" type="button" onClick={() => setModalOpen(false)}>
              &times;
            </button>
            <h3 className="modal-title">
              <i className="uil uil-info-circle" /> Instrucciones para la simulación
            </h3>
            <div className="modal-body">
              <p>Ingresa los pulsos de la señal guiándote con la gráfica conceptual.</p>
              <div style={{ textAlign: 'center', margin: '12px 0' }}>
                <img src="/img/figura_pulso.png" alt="Figura de pulso" style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }} />
              </div>
              <ul>
                <li>
                  <strong>
                    t<sub>i</sub>
                  </strong>{' '}
                  es donde inicia el pulso y{' '}
                  <strong>
                    t<sub>f</sub>
                  </strong>{' '}
                  donde termina (t<sub>f</sub> &gt; t<sub>i</sub>).
                </li>
                <li>
                  <strong>A</strong> es la amplitud del pulso entre t<sub>i</sub> y t<sub>f</sub>.
                </li>
                <li>
                  El t<sub>i</sub> de un pulso no puede ser menor que el t<sub>f</sub> del anterior. Si hay un hueco
                  entre pulsos, ahí la señal vale 0.
                </li>
                <li>
                  Un pulso solo se usa si tiene los tres campos llenos. Puedes agregar hasta {MAX_PULSES} pulsos.
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
