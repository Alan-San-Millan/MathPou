import { useEffect, useRef, useState } from 'react'
import { postPulse } from '../../shared/api/client'
import { attachTimeDomainPlot } from './timeDomainPlot'
import './time-domain.css'

type Pulse = { amp: string; t: string }

// Preview local de la escalera. El servidor sigue siendo la fuente de T y ω₀.

function tileSignal(timeArr: number[], signalArr: number[], T: number, repeatsAfter = 3) {
  if (!isFinite(T) || T <= 0) return { time: timeArr, signal: signalArr }
  const outTime = [...timeArr]
  const outSignal = [...signalArr]
  for (let r = 1; r <= repeatsAfter; r++) {
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
  if (times.length >= 3 && times[1] === times[0] && times[2] > times[1]) {
    segments.push({ start: times[0] - (times[2] - times[1]), end: times[0], amp: amps[0] })
  }
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
  const [t0, setT0] = useState('')
  const [pulses, setPulses] = useState<Pulse[]>([{ amp: '', t: '' }])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ T: number; w0: number; matriz: number[][] } | null>(null)
  const plotHost = useRef<HTMLDivElement | null>(null)
  const seriesRef = useRef<{ time: number[]; signal: number[] } | null>(null)
  const plotRef = useRef<{ redraw: () => void; remove: () => void } | null>(null)

  useEffect(() => {
    if (!plotHost.current) return undefined
    plotRef.current = attachTimeDomainPlot(plotHost.current, () => seriesRef.current)
    return () => {
      plotRef.current?.remove()
      plotRef.current = null
    }
  }, [])

  function currentMatriz(): number[][] | null {
    const t0Val = Number(t0)
    if (t0.trim() === '' || Number.isNaN(t0Val)) return null
    const matriz: number[][] = [[0, t0Val]]
    for (const pulse of pulses) {
      if (pulse.amp.trim() === '' || pulse.t.trim() === '') return null
      const amp = Number(pulse.amp)
      const time = Number(pulse.t)
      if (Number.isNaN(amp) || Number.isNaN(time)) return null
      matriz.push([amp, time])
    }
    return matriz
  }

  function addPulse() {
    if (pulses.length >= 10) {
      setError('Se ha alcanzado el límite de 10 pulsos.')
      return
    }
    if (t0.trim() === '' || pulses.some((pulse) => pulse.amp.trim() === '' || pulse.t.trim() === '')) {
      setError('Por favor, llene todos los campos antes de crear nuevos.')
      return
    }
    setError('')
    setPulses((prev) => [...prev, { amp: '', t: '' }])
    setNotice('Se agregó un nuevo campo siguiendo el patrón t0, a1, t1, ...')
  }

  function clearAll() {
    setT0('')
    setPulses([{ amp: '', t: '' }])
    setError('')
    setNotice('')
    setResult(null)
    seriesRef.current = null
    plotRef.current?.redraw()
  }

  async function generate() {
    setError('')
    setNotice('')
    const matriz = currentMatriz()
    if (!matriz || matriz.length <= 1) {
      setError('Debe crear al menos un pulso con valores válidos.')
      return
    }
    for (let i = 1; i < matriz.length; i++) {
      if (matriz[i][1] < matriz[i - 1][1]) {
        setError(`El tiempo t${i} (${matriz[i][1]}) debe ser mayor o igual que t${i - 1} (${matriz[i - 1][1]})`)
        return
      }
    }

    const preview = buildPreview(matriz)
    seriesRef.current = preview
    plotRef.current?.redraw()

    setBusy(true)
    try {
      const data = await postPulse(matriz)
      setResult({ T: data.T, w0: data.w0, matriz })
      setNotice('La visualización se ha creado correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hubo un problema al intentar procesar los datos.')
    } finally {
      setBusy(false)
    }
  }

  const duraciones = result
    ? result.matriz.slice(1).map((row, index) => row[1] - result.matriz[index][1])
    : []

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
          <header className="lab-page-header">
            <p className="mp-eyebrow">
              <i className="uil uil-clock" aria-hidden="true" /> Dominio del tiempo
            </p>
            <h1>Análisis de Fourier en el dominio del tiempo</h1>
            <p className="mp-lede">
              Define el instante inicial t<sub>0</sub> y cada pulso (amplitud A<sub>k</sub>, tiempo t<sub>k</sub>).
              La vista previa dibuja la escalera; el servidor calcula el periodo T y ω₀.
            </p>
          </header>
          <div className="input-section lab-section mp-lift">
            <div className="section-title">
              <span className="mp-icon-chip" aria-hidden="true">
                <i className="uil uil-sliders-v" />
              </span>
              <span>Parámetros de la señal</span>
            </div>
            <p className="section-help">
              Completa todos los campos antes de agregar otro pulso. Los tiempos deben ir en orden no
              decreciente (t<sub>k</sub> ≥ t<sub>k−1</sub>).
            </p>
            <div id="inputs-container">
              <div id="inputs-list" className="pulse-inputs">
                <div className="input-group">
                  <label htmlFor="time-t0">
                    <i className="uil uil-clock" aria-hidden="true" /> Tiempo t<sub>0</sub>
                  </label>
                  <input
                    id="time-t0"
                    type="number"
                    className="tiempo"
                    value={t0}
                    onChange={(e) => setT0(e.target.value)}
                    placeholder="Puede ser 0 o negativo"
                    step="0.1"
                  />
                </div>
                {pulses.map((pulse, index) => (
                  <div className="pulse-row" key={index}>
                    <div className="input-group">
                      <label htmlFor={`amp-${index}`}>
                        <i className="uil uil-chart-growth" aria-hidden="true" /> Amplitud A<sub>{index + 1}</sub>
                      </label>
                      <input
                        id={`amp-${index}`}
                        type="number"
                        className="amplitud"
                        value={pulse.amp}
                        onChange={(e) => {
                          const next = [...pulses]
                          next[index] = { ...next[index], amp: e.target.value }
                          setPulses(next)
                        }}
                        placeholder="Amplitud"
                        step="0.1"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor={`time-t${index + 1}`}>
                        <i className="uil uil-clock" aria-hidden="true" /> Tiempo t<sub>{index + 1}</sub>
                      </label>
                      <input
                        id={`time-t${index + 1}`}
                        type="number"
                        className="tiempo"
                        value={pulse.t}
                        onChange={(e) => {
                          const next = [...pulses]
                          next[index] = { ...next[index], t: e.target.value }
                          setPulses(next)
                        }}
                        placeholder="Fin del pulso"
                        step="0.1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="button-container">
              <button type="button" className="btn btn-create mp-press" onClick={addPulse}>
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
                        <th>Amplitud</th>
                        <th>Ancho o duración</th>
                      </tr>
                      {result.matriz.slice(1).map((row, index) => (
                        <tr key={index}>
                          <td>Pulso {index + 1}</td>
                          <td>
                            A<sub>{index + 1}</sub> = {row[0]}
                          </td>
                          <td>
                            {duraciones[index].toFixed(2)} (t<sub>{index + 1}</sub> − t<sub>{index}</sub>)
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="result-summary" colSpan={3}>
                          <strong>Función de {result.matriz.length - 1} pulsos</strong>
                          <br />
                          <strong>Periodo (T):</strong> {result.T.toFixed(4)}
                          <br />
                          <strong>Frecuencia angular (ω₀):</strong> {result.w0.toFixed(4)}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td className="empty-state" colSpan={3}>
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
            <p className="section-help">Escalera periódica construida a partir de tus pulsos (vista previa local).</p>
            <div id="plot-container" ref={plotHost} />
          </div>
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
              <p>
                Instrucciones para la simulación: Ingresa los datos relacionados con la gráfica conceptual mostrada.{' '}
                <strong>
                  t<sub>0</sub>
                </strong>{' '}
                es donde inicia el primer módulo y{' '}
                <strong>
                  t<sub>1</sub>
                </strong>{' '}
                donde termina.{' '}
                <strong>
                  A<sub>1</sub>
                </strong>{' '}
                es la amplitud entre t<sub>0</sub> y t<sub>1</sub>.
              </p>
              <div style={{ textAlign: 'center', margin: '12px 0' }}>
                <img src="/img/figura_pulso.png" alt="Figura de pulso" style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }} />
              </div>
              <ul>
                <li>
                  <strong>
                    t<sub>0</sub>
                  </strong>{' '}
                  es donde inicia el primer módulo (valor inicial)
                </li>
                <li>
                  <strong>
                    t<sub>1</sub>
                  </strong>{' '}
                  es donde termina el primer módulo
                </li>
              </ul>
              <p>
                <strong>Nota:</strong> Se permiten ceros en tiempos y amplitudes (tiempos iguales producen duraciones cero).
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
