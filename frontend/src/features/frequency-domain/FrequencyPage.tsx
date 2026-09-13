import { useEffect, useRef } from 'react'
import { attachFrequencySketch } from './frequencySketch'
import './frequency-domain.css'

type PulseHandle = {
  loadExample: (id: number) => void
  clear: () => void
  remove: () => void
}

const presets = [
  { id: 1, title: 'Ejemplo 1', icon: 'uil uil-bolt' },
  { id: 2, title: 'Señal triangular', icon: 'uil uil-triangle' },
  { id: 3, title: 'Señal cuadrada', icon: 'uil uil-square' },
  { id: 4, title: 'Señal sierra', icon: 'uil uil-chart' },
]

// Editor espectral 100% cliente. Los presets viven en frequencySketch.js, no en el API.
export function FrequencyPage() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const sketchRef = useRef<PulseHandle | null>(null)

  useEffect(() => {
    if (!hostRef.current) return undefined
    sketchRef.current = attachFrequencySketch(hostRef.current)
    // StrictMode monta/desmonta dos veces en dev: remove() evita canvas fantasma.
    return () => {
      sketchRef.current?.remove()
      sketchRef.current = null
    }
  }, [])

  return (
    <div className="frequency-page mp-enter">
      <div className="container">
        <header className="lab-page-header">
          <p className="mp-eyebrow">
            <i className="uil uil-graph-bar" aria-hidden="true" /> Dominio de la frecuencia
          </p>
          <h1>Dominio de la frecuencia</h1>
          <p className="mp-lede">
            Arrastra las barras de amplitud A₀–A₁₁ y las fases φ. Arriba ves el espectro editable; en
            el centro cada armónico; abajo la suma (reconstrucción). Los presets viven solo en el
            navegador: no llaman al API.
          </p>
        </header>
        <section className="lab-section" aria-label="Presets de ejemplo">
          <div className="section-title">
            <span className="mp-icon-chip" aria-hidden="true">
              <i className="uil uil-apps" />
            </span>
            <span>Cargar un ejemplo típico</span>
          </div>
          <div className="menu-card mp-stagger">
            {presets.map((preset) => (
              <div className="menu-item mp-lift" key={preset.id}>
                <h3>
                  <i className={preset.icon} aria-hidden="true" /> {preset.title}
                </h3>
                <button
                  type="button"
                  className="mp-press"
                  onClick={() => sketchRef.current?.loadExample(preset.id)}
                >
                  <i className="uil uil-import" aria-hidden="true" /> Cargar
                </button>
              </div>
            ))}
            <div className="menu-item mp-lift">
              <h3>
                <i className="uil uil-refresh" aria-hidden="true" /> Reiniciar
              </h3>
              <button type="button" className="mp-press" onClick={() => sketchRef.current?.clear()}>
                <i className="uil uil-trash-alt" aria-hidden="true" /> Limpiar
              </button>
            </div>
          </div>
        </section>
        <section className="lab-section canvas-section" aria-label="Editor espectral">
          <p className="section-help canvas-hint">
            En pantallas estrechas el lienzo se escala al ancho disponible. Usa el dedo o el ratón
            para arrastrar las barras.
          </p>
          <div id="canvas-container" ref={hostRef} />
        </section>
      </div>
    </div>
  )
}
