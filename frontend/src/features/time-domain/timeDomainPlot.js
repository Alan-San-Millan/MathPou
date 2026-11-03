import p5 from 'p5'

export const IDEAL_COLOR = '#0b2a5b'
export const RECONSTRUCTION_COLOR = '#d00000'

function plotSize(container) {
  const width = Math.max(280, Math.floor(container.clientWidth || 800))
  const height = Math.max(240, Math.round(width * 0.5))
  return { width, height }
}

function computeBounds(layers) {
  const time = layers.flatMap((layer) => layer.time)
  const signal = layers.flatMap((layer) => layer.signal)
  let minX = Math.min(...time)
  let maxX = Math.max(...time)
  let minY = Math.min(...signal)
  let maxY = Math.max(...signal)
  if (Math.abs(maxX - minX) < 1e-6) {
    minX -= 0.5
    maxX += 0.5
  } else {
    const range = (maxX - minX) || 1
    maxX = maxX + range * 0.05
  }
  if (Math.abs(maxY - minY) < 1e-6) {
    minY -= 1
    maxY += 1
  }
  if (minY > 0) minY = 0
  maxY = Math.ceil(maxY * 1.5)
  const maxAmplitude = Math.max(...signal)
  if (maxY < maxAmplitude + 2) maxY = Math.ceil(maxAmplitude + 2)
  return {
    minX: Math.floor(minX),
    maxX: Math.ceil(maxX),
    minY: Math.floor(minY),
    maxY: Math.ceil(maxY),
  }
}

// getLayers() → capas a dibujar: { time, signal, color, step, label }.
// getBoundsLayers() → capas que fijan los ejes; permite que las tres gráficas compartan escala.
export function attachTimeDomainPlot(container, getLayers, getBoundsLayers = getLayers) {
  const sketch = (p) => {
    p.setup = () => {
      const { width, height } = plotSize(container)
      const canvas = p.createCanvas(width, height)
      canvas.parent(container)
      p.noLoop()
    }

    p.windowResized = () => {
      const { width, height } = plotSize(container)
      p.resizeCanvas(width, height)
    }

    p.draw = () => {
      p.background(255)
      const layers = (getLayers() || []).filter((layer) => layer?.time?.length && layer?.signal?.length)
      if (!layers.length) {
        p.textSize(16)
        p.textAlign(p.CENTER, p.CENTER)
        p.fill(108, 117, 125)
        p.noStroke()
        p.text('La gráfica se generará aquí después de ingresar los datos', p.width / 2, p.height / 2)
        return
      }

      const boundsLayers = (getBoundsLayers() || []).filter((layer) => layer?.time?.length && layer?.signal?.length)
      const { minX, maxX, minY, maxY } = computeBounds(boundsLayers.length ? boundsLayers : layers)

      const left = 50
      const right = p.width - 50
      // Margen superior amplio: arriba a la derecha va el slider de armónicos (HTML) y debajo la leyenda.
      const top = 90
      const bottom = p.height - 50

      p.stroke('#000')
      p.strokeWeight(2)
      p.line(left, bottom, right, bottom)
      p.line(left, top, left, bottom)
      p.textSize(12)
      p.textAlign(p.CENTER, p.CENTER)
      p.fill('#000')
      p.noStroke()
      for (let v = minX; v <= maxX; v += 1) {
        const x = p.map(v, minX, maxX, left, right)
        p.stroke('#000')
        p.strokeWeight(1)
        p.line(x, bottom - 5, x, bottom + 5)
        p.noStroke()
        p.fill('#000')
        p.text(String(v), x, bottom + 20)
      }
      for (let v = minY; v <= maxY; v += 1) {
        const y = p.map(v, minY, maxY, bottom, top)
        p.stroke('#000')
        p.strokeWeight(1)
        p.line(left - 5, y, left + 5, y)
        p.noStroke()
        p.fill('#000')
        p.text(String(v), 18, y)
      }
      p.textSize(14)
      p.text('Tiempo', p.width / 2, p.height - 12)
      p.push()
      p.translate(14, p.height / 2)
      p.rotate(-p.HALF_PI)
      p.text('Amplitud', 0, 0)
      p.pop()

      const mapX = (v) => p.map(v, minX, maxX, left, right)
      const mapY = (v) => p.map(v, minY, maxY, bottom, top)

      for (const layer of layers) {
        const { time, signal } = layer
        p.stroke(layer.color)
        p.strokeWeight(layer.step ? 3 : 2)
        p.noFill()
        if (layer.step) {
          for (let i = 1; i < signal.length; i++) {
            const x0 = mapX(time[i - 1])
            const y0 = mapY(signal[i - 1])
            const x1 = mapX(time[i])
            p.line(x0, y0, x1, y0)
            const y1 = mapY(signal[i])
            if (y1 !== y0) p.line(x1, y0, x1, y1)
          }
        } else {
          p.beginShape()
          for (let i = 0; i < signal.length; i++) p.vertex(mapX(time[i]), mapY(signal[i]))
          p.endShape()
        }
      }

      if (layers.length > 1) {
        p.textSize(12)
        p.textAlign(p.LEFT, p.CENTER)
        layers.forEach((layer, index) => {
          const y = 58 + index * 16
          p.stroke(layer.color)
          p.strokeWeight(3)
          p.line(right - 140, y, right - 115, y)
          p.noStroke()
          p.fill('#000')
          p.text(layer.label ?? '', right - 108, y)
        })
      }
    }
  }

  const instance = new p5(sketch, container)
  return {
    redraw: () => instance.redraw(),
    remove: () => instance.remove(),
  }
}
