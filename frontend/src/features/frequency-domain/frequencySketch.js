import p5 from 'p5'

const EXAMPLE_PRESETS = {
  1: {
    amps: [0.8, 0.6, 0.4, 0.3, 0.2, 0.1, 0.05, 0.03, 0.02, 0.01, 0.005],
    phases: [Math.PI / 4, Math.PI / 3, Math.PI / 2, Math.PI, 0, Math.PI / 6, Math.PI / 8, Math.PI / 10, Math.PI / 12, Math.PI / 14, Math.PI / 16],
  },
  2: {
    amps: [1, 0, 0.11111111, 0, 0.04, 0, 0.02040816, 0, 0.01234568, 0, 0.00826446],
    phases: [-1.57079632, 1.69914315, 1.57079632, -1.57895407, -1.57079632, 1.56113291, -1.57079632, -1.5205868, 1.57079632, 1.57351257, -1.57079632],
  },
  3: {
    amps: [0.82699335, 0.41349667, 0, 0.20674834, 0.16539867, 0, 0.11814191, 0.10337432, 0, 0.08269934, 0.07518122],
    phases: [-2.0943951, -1.04719755, -3.14159265, -2.0943951, -1.04719755, -3.14159265, -2.0943951, -1.04719755, -3.14159265, -2.0943951, -1.04719755],
  },
  4: {
    amps: [1, 0, 0.28744933, 0, 0.17007476, 0, 0.12100643, 0, 0.09396349, 0, 0.07681592],
    phases: [-1.00388482, 0, -1.36169169, 0, -1.44415379, 0, 1.48010015, 0, 1.50017842, 0, 1.51298629],
  },
}

// Sketch p5 del dominio de la frecuencia (antes pulseSketch / pulso.js).
export function attachFrequencySketch(container) {
  let api = {
    loadExample() {},
    clear() {},
  }

  const sketch = (p) => {
    const components = Array.from({ length: 12 }, () => ({ amp: 0, phase: 0 }))
    const w = 8
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#54a0ff', '#9b59b6', '#ff9ff3', '#00d2d3', '#e84393', '#2ecc71', '#8e44ad']
    const t = []
    const bars = []
    const phaseBars = []
    let dragging = null
    let draggingType = null
    let individualCanvas
    let sumCanvas
    let barCanvas

    function normalizePhase(phase) {
      while (phase > p.PI) phase -= 2 * p.PI
      while (phase < -p.PI) phase += 2 * p.PI
      return phase
    }

    function lightenColor(col, amt) {
      const c = p.color(col)
      return p.color(p.red(c) + amt, p.green(c) + amt, p.blue(c) + amt)
    }

    function drawBars() {
      barCanvas.background(255)
      barCanvas.fill(240, 242, 245)
      barCanvas.noStroke()
      barCanvas.rect(10, 10, 780, 230, 15)
      barCanvas.fill(44, 62, 80)
      barCanvas.textAlign(p.CENTER, p.CENTER)
      barCanvas.textStyle(p.BOLD)
      barCanvas.text('Amplitudes (A)', 400, 40)
      barCanvas.text('Fases (F)', 400, 140)
      barCanvas.stroke(200)
      barCanvas.strokeWeight(1)
      barCanvas.line(20, 80, 780, 80)
      barCanvas.line(20, 180, 780, 180)

      for (let i = 0; i < components.length; i++) {
        const bar = bars[i]
        const colAmp = i === 0 ? '#2c3e50' : colors[i - 1] || '#54a0ff'
        barCanvas.fill(colAmp)
        barCanvas.stroke(44, 62, 80)
        barCanvas.strokeWeight(bar.dragging ? 2 : 1)
        barCanvas.rect(bar.x, bar.y, bar.width, -bar.amplitude * 50, 8)

        const phaseBar = phaseBars[i]
        const colPhase = i === 0 ? lightenColor('#2c3e50', 30) : lightenColor(colors[i - 1] || '#54a0ff', 50)
        barCanvas.fill(colPhase)
        barCanvas.stroke(44, 62, 80)
        barCanvas.strokeWeight(phaseBar.dragging ? 2 : 1)
        barCanvas.rect(phaseBar.x, phaseBar.y, phaseBar.width, -phaseBar.phase * 30, 8)

        barCanvas.fill(44, 62, 80)
        barCanvas.noStroke()
        barCanvas.textAlign(p.CENTER, p.CENTER)
        barCanvas.textStyle(p.NORMAL)
        barCanvas.text(`A${i}`, bar.x + bar.width / 2, 110)
        barCanvas.text(`φ${i}`, phaseBar.x + phaseBar.width / 2, 220)
      }
    }

    function drawIndividualSignals() {
      individualCanvas.background(255)
      individualCanvas.stroke(230)
      individualCanvas.strokeWeight(1)
      for (let y = 50; y <= 250; y += 50) individualCanvas.line(0, y, 800, y)
      for (let x = 0; x <= 800; x += 100) individualCanvas.line(x, 0, x, 300)
      individualCanvas.stroke(100)
      individualCanvas.strokeWeight(2)
      individualCanvas.line(0, 150, 800, 150)
      individualCanvas.line(0, 0, 0, 300)
      individualCanvas.fill(44, 62, 80)
      individualCanvas.noStroke()
      individualCanvas.textAlign(p.CENTER, p.CENTER)
      individualCanvas.text('Tiempo', 400, 290)
      individualCanvas.text('Amplitud', 20, 20)
      individualCanvas.stroke('#2c3e50')
      individualCanvas.strokeWeight(3)
      const a0OffsetY = 150 - components[0].amp * 50
      individualCanvas.line(0, a0OffsetY, 800, a0OffsetY)
      for (let i = 1; i < components.length; i++) {
        individualCanvas.stroke(colors[i - 1])
        individualCanvas.noFill()
        individualCanvas.beginShape()
        for (let x = 0; x < 800; x++) {
          const y = 150 + components[i].amp * 50 * p.cos(i * w * t[x] + components[i].phase)
          individualCanvas.vertex(x, y)
        }
        individualCanvas.endShape()
      }
    }

    function drawSumSignal() {
      sumCanvas.background(255)
      sumCanvas.stroke(230)
      sumCanvas.strokeWeight(1)
      for (let y = 50; y <= 350; y += 50) sumCanvas.line(0, y, 800, y)
      for (let x = 0; x <= 800; x += 100) sumCanvas.line(x, 0, x, 400)
      sumCanvas.stroke(100)
      sumCanvas.strokeWeight(2)
      sumCanvas.line(0, 200, 800, 200)
      sumCanvas.line(0, 0, 0, 400)
      sumCanvas.fill(44, 62, 80)
      sumCanvas.noStroke()
      sumCanvas.textAlign(p.CENTER, p.CENTER)
      sumCanvas.text('Tiempo', 400, 390)
      sumCanvas.text('Amplitud', 20, 20)
      sumCanvas.stroke('#2c3e50')
      sumCanvas.strokeWeight(3)
      sumCanvas.noFill()
      sumCanvas.beginShape()
      for (let x = 0; x < 800; x++) {
        let sumY = components[0].amp * 50
        for (let i = 1; i < components.length; i++) {
          sumY += components[i].amp * 50 * p.cos(i * w * t[x] + components[i].phase)
        }
        sumCanvas.vertex(x, 200 + sumY)
      }
      sumCanvas.endShape()
    }

    function fitToContainer() {
      const parentW = container.clientWidth || 800
      const scale = Math.min(1, parentW / 800)
      const el = p.canvas
      if (!el) return
      el.style.width = `${800 * scale}px`
      el.style.height = `${950 * scale}px`
      el.style.maxWidth = '100%'
      el.style.touchAction = 'none'
    }

    p.setup = () => {
      for (let i = 0; i < 800; i++) t[i] = p.map(i, 0, 799, 0, (6 * p.PI) / w)
      individualCanvas = p.createGraphics(800, 300)
      sumCanvas = p.createGraphics(800, 400)
      barCanvas = p.createGraphics(800, 250)
      const mainCanvas = p.createCanvas(800, 950)
      mainCanvas.parent(container)
      p.textSize(14)
      p.textFont('Atkinson Hyperlegible, Segoe UI, sans-serif')
      for (let i = 0; i < components.length; i++) {
        bars.push({ x: i * 65 + 30, y: 80, width: 30, amplitude: components[i].amp, dragging: false })
        phaseBars.push({ x: i * 65 + 30, y: 180, width: 30, phase: components[i].phase, dragging: false })
      }
      fitToContainer()
    }

    p.windowResized = () => {
      fitToContainer()
    }

    p.draw = () => {
      p.background(245, 247, 250)
      drawBars()
      drawIndividualSignals()
      drawSumSignal()
      p.image(barCanvas, 0, 0)
      p.image(individualCanvas, 0, 250)
      p.image(sumCanvas, 0, 550)
      if (dragging !== null) {
        let value
        if (draggingType === 'amplitude') {
          const bar = bars[dragging]
          value = (bar ? bar.amplitude : components[dragging]?.amp || 0).toFixed(4)
        } else {
          const pbar = phaseBars[dragging]
          value = (pbar ? pbar.phase : components[dragging]?.phase || 0).toFixed(2)
        }
        const label = draggingType === 'amplitude' ? `A${dragging}: ${value}` : `F${dragging}: ${value}`
        p.fill(50, 50, 50, 220)
        p.noStroke()
        p.rect(p.mouseX + 15, p.mouseY - 30, p.textWidth(label) + 20, 30, 10)
        p.fill(255)
        p.textAlign(p.CENTER, p.CENTER)
        p.text(label, p.mouseX + 15 + p.textWidth(label) / 2 + 10, p.mouseY - 15)
      }
    }

    p.mousePressed = () => {
      for (let i = 0; i < components.length; i++) {
        const phaseBar = phaseBars[i]
        if (phaseBar && p.mouseX > phaseBar.x && p.mouseX < phaseBar.x + phaseBar.width && p.mouseY > phaseBar.y - 30 && p.mouseY < phaseBar.y + 30) {
          phaseBar.dragging = true
          dragging = i
          draggingType = 'phase'
          return
        }
        const bar = bars[i]
        if (bar && p.mouseX > bar.x && p.mouseX < bar.x + bar.width && p.mouseY > bar.y - 30 && p.mouseY < bar.y + 30) {
          bar.dragging = true
          dragging = i
          draggingType = 'amplitude'
          return
        }
      }
      dragging = null
      draggingType = null
    }

    p.mouseDragged = () => {
      if (dragging === null) return
      if (draggingType === 'amplitude') {
        const bar = bars[dragging]
        if (bar) {
          bar.amplitude = p.constrain((80 - p.mouseY) / 40, -1, 1)
          components[dragging].amp = bar.amplitude
        }
      } else if (draggingType === 'phase') {
        const phaseBar = phaseBars[dragging]
        if (phaseBar) {
          phaseBar.phase = normalizePhase(p.constrain((180 - p.mouseY) / 30, -p.PI, p.PI))
          components[dragging].phase = phaseBar.phase
        }
      }
    }

    p.mouseReleased = () => {
      for (let i = 0; i < components.length; i++) {
        if (bars[i]) bars[i].dragging = false
        if (phaseBars[i]) phaseBars[i].dragging = false
      }
      dragging = null
      draggingType = null
    }

    api = {
      loadExample(id) {
        const preset = EXAMPLE_PRESETS[id]
        if (!preset) return
        for (let i = 1; i < components.length; i++) {
          components[i].amp = preset.amps[i - 1] || 0
          components[i].phase = preset.phases[i - 1] || 0
          if (bars[i]) bars[i].amplitude = components[i].amp
          if (phaseBars[i]) phaseBars[i].phase = components[i].phase
        }
      },
      clear() {
        for (let i = 0; i < components.length; i++) {
          components[i].amp = 0
          components[i].phase = 0
          if (bars[i]) bars[i].amplitude = 0
          if (phaseBars[i]) phaseBars[i].phase = 0
        }
        dragging = null
        draggingType = null
      },
    }
  }

  const instance = new p5(sketch, container)
  return {
    loadExample: (id) => api.loadExample(id),
    clear: () => api.clear(),
    remove: () => instance.remove(),
  }
}
