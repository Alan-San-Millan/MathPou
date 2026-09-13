import { useEffect, useRef } from 'react'
import p5 from 'p5'
import { getExample } from '../../shared/api/client'

import './examples.css'

const EXAMPLES = [
  {
    id: '1',
    title: '1. Onda Cuadrada',
    formula: 'https://latex.codecogs.com/png.image?\\dpi{120}&space;f(t)=\\frac{4A}{\\pi}\\sum_{n=1}^{\\infty}\\frac{1}{2n-1}\\sin((2n-1)\\omega_0t)',
    image: '/img/img1.png',
    live: true,
  },
  {
    id: '2',
    title: '2. Tren de Pulsos Rectangulares',
    formula: 'https://latex.codecogs.com/png.image?\\dpi{120}&space;f(t)=\\frac{A\\tau}{T}+\\frac{2A}{T}\\sum_{n=1}^{\\infty}\\frac{1}{n}\\sin\\left(\\frac{n\\pi\\tau}{T}\\right)\\cos(n\\omega_0t)',
    image: '/img/img2.png',
    live: true,
  },
  {
    id: '3',
    title: '3. Onda Diente de Sierra',
    formula: 'https://latex.codecogs.com/png.image?\\dpi{120}&space;f(t)=\\frac{A}{2}-\\frac{A}{\\pi}\\sum_{n=1}^{\\infty}\\frac{1}{n}\\sin(n\\omega_0t)',
    image: '/img/img3.png',
    live: true,
  },
  {
    id: '4',
    title: '4. Onda Triangular',
    formula: 'https://latex.codecogs.com/png.image?\\dpi{120}&space;f(t)=\\frac{A}{2}-\\frac{4A}{\\pi^2}\\sum_{n=1}^{\\infty}\\frac{1}{(2n-1)^2}\\cos((2n-1)\\omega_0t)',
    image: '/img/img4.png',
    live: true,
  },
  {
    id: '5',
    title: '5. Seno Rectificado de Media Onda',
    formula: 'https://latex.codecogs.com/png.image?\\dpi{120}&space;f(t)=\\frac{A}{\\pi}+\\frac{A}{2}\\sin(\\omega_0t)-\\frac{2A}{\\pi}\\sum_{n=1}^{\\infty}\\frac{1}{4n^2-1}\\cos(2n\\omega_0t)',
    image: '/img/img5.png',
    live: false,
  },
  {
    id: '6',
    title: '6. Seno Rectificado de Onda Completa',
    formula: 'https://latex.codecogs.com/png.image?\\dpi{120}&space;f(t)=\\frac{2A}{\\pi}+\\frac{4A}{\\pi}\\sum_{n=1}^{\\infty}\\frac{1}{4n^2-1}\\cos(n\\omega_0t)',
    image: '/img/img6.png',
    live: false,
  },
]

function ExamplePlot({ graphId }: { graphId: string }) {
  // Cada tarjeta monta su propio p5. Si el API falla, dibujamos un mensaje en el canvas.
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    let cancelled = false
    let series: { time: number[]; signal: number[] } | null = null

    const size = () => {
      const width = Math.max(240, Math.floor(host.clientWidth || 320))
      const height = Math.max(180, Math.round(width * 0.68))
      return { width, height }
    }

    const paint = (p: InstanceType<typeof p5>) => {
      p.background(255)
      if (!series || !series.time.length || !series.signal.length) {
        p.fill(150)
        p.textAlign(p.CENTER, p.CENTER)
        p.text('Sin datos de señal', p.width / 2, p.height / 2)
        return
      }
      const { time, signal } = series
      const minX = Math.min(...time)
      const maxX = Math.max(...time)
      const minY = Math.min(...signal)
      const maxY = Math.max(...signal)
      p.stroke('#0c2740')
      p.strokeWeight(2)
      p.line(40, p.height - 30, p.width - 20, p.height - 30)
      p.line(40, 20, 40, p.height - 30)
      p.stroke('#0f766e')
      p.noFill()
      p.beginShape()
      const step = Math.max(1, Math.floor(signal.length / 400))
      for (let i = 0; i < signal.length; i += step) {
        const x = p.map(time[i], minX, maxX, 40, p.width - 20)
        const y = p.map(signal[i], minY, maxY, p.height - 30, 20)
        p.vertex(x, y)
      }
      p.endShape()
    }

    const sketch = (p: InstanceType<typeof p5>) => {
      p.setup = () => {
        const { width, height } = size()
        p.createCanvas(width, height).parent(host)
        p.noLoop()
        getExample(graphId)
          .then((data) => {
            if (cancelled) return
            series = { time: data.time ?? [], signal: data.signal ?? [] }
            paint(p)
          })
          .catch(() => {
            if (cancelled) return
            p.background(255)
            p.fill(150)
            p.textAlign(p.CENTER, p.CENTER)
            p.text('No se pudo cargar la gráfica', p.width / 2, p.height / 2)
          })
      }
      p.windowResized = () => {
        const { width, height } = size()
        p.resizeCanvas(width, height)
        if (series) paint(p)
      }
    }
    const instance = new p5(sketch, host)
    return () => {
      cancelled = true
      instance.remove()
    }
  }, [graphId])

  return <div className="example-plot-host" id={`plot-container${graphId}`} ref={hostRef} />
}

export function ExamplesPage() {
  return (
    <div className="examples-page mp-enter">
      <div className="scroll-container">
        <header className="lab-page-header">
          <p className="mp-eyebrow">
            <i className="uil uil-books" aria-hidden="true" /> Galería
          </p>
          <h1>Ejemplos de series típicas</h1>
          <p className="examples-lede">
            Cada tarjeta muestra la fórmula de la tesis y una gráfica. Las 1–4 se reconstruyen en el
            servidor (JWT requerido). Las 5 y 6 usan la figura fija de la tesis.
          </p>
        </header>
        <div className="row mp-stagger">
          {EXAMPLES.map((example) => (
            <article className="card mp-lift" key={example.id}>
              <div className="card-header">
                <span>{example.title}</span>
                <span className="card-badge">
                  <i
                    className={example.live ? 'uil uil-cloud-data-connection' : 'uil uil-image'}
                    aria-hidden="true"
                  />{' '}
                  {example.live ? 'API en vivo' : 'Figura fija'}
                </span>
              </div>
              <div className="card-body">
                <div className="formula">
                  <img src={example.formula} alt={`Fórmula de ${example.title}`} />
                </div>
                <div className="featured-image">
                  {example.live ? (
                    <ExamplePlot graphId={example.id} />
                  ) : (
                    <img src={example.image} alt={example.title} />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
