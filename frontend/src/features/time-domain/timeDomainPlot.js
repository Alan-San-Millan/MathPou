import p5 from 'p5'

function plotSize(container) {
  const width = Math.max(280, Math.floor(container.clientWidth || 800))
  const height = Math.max(240, Math.round(width * 0.5))
  return { width, height }
}

// Canvas de la escalera del dominio del tiempo. Antes se llamaba stepPlot.js.
export function attachTimeDomainPlot(container, getSeries) {
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
      const series = getSeries()
      if (!series || !series.time?.length) {
        p.textSize(16)
        p.textAlign(p.CENTER, p.CENTER)
        p.fill(108, 117, 125)
        p.noStroke()
        p.text('La gráfica se generará aquí después de ingresar los datos', p.width / 2, p.height / 2)
        return
      }

      const { time, signal } = series
      if (!signal?.length) {
        p.textAlign(p.CENTER, p.CENTER)
        p.fill(108, 117, 125)
        p.text('Sin puntos de señal para dibujar', p.width / 2, p.height / 2)
        return
      }

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
      minX = Math.floor(minX)
      maxX = Math.ceil(maxX)
      minY = Math.floor(minY)
      maxY = Math.ceil(maxY)

      const left = 50
      const right = p.width - 50
      const top = 50
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

      p.stroke(255, 165, 0)
      p.strokeWeight(3)
      p.noFill()
      for (let i = 1; i < signal.length; i++) {
        const x0 = p.map(time[i - 1], minX, maxX, left, right)
        const y0 = p.map(signal[i - 1], minY, maxY, bottom, top)
        const x1 = p.map(time[i], minX, maxX, left, right)
        p.line(x0, y0, x1, y0)
        const y1 = p.map(signal[i], minY, maxY, bottom, top)
        if (y1 !== y0) p.line(x1, y0, x1, y1)
      }
    }
  }

  const instance = new p5(sketch, container)
  return {
    redraw: () => instance.redraw(),
    remove: () => instance.remove(),
  }
}
