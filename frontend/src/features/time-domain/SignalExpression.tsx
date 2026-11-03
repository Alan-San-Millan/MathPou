import { memo } from 'react'
import type { Reconstruction } from '../../shared/api/client'

const SHOWN_HARMONICS = 5

function fmt(value: number, digits = 4): string {
  if (Math.abs(value) < 0.5 * 10 ** -digits) return '0'
  return value.toFixed(digits).replace(/\.?0+$/, '')
}

function signed(value: number): { sign: string; abs: string } {
  return { sign: value < 0 ? '−' : '+', abs: fmt(Math.abs(value)) }
}

type Props = {
  matriz: number[][]
  T: number
  w0: number
  harmonics: number
  reconstruction: Reconstruction
}

function SignalExpressionView({ matriz, T, w0, harmonics, reconstruction }: Props) {
  const pieces = matriz
    .slice(1)
    .map((row, index) => ({ amp: row[0], start: matriz[index][1], end: row[1], k: index + 1 }))
    .filter((piece) => piece.end > piece.start)

  const { a0, an, bn, magnitudes, phi } = reconstruction
  const w0Text = fmt(w0)
  const terms: { n: number; kind: 'cos' | 'sin'; value: number }[] = []
  for (let i = 0; i < Math.min(SHOWN_HARMONICS, an.length); i++) {
    if (fmt(an[i]) !== '0') terms.push({ n: i + 1, kind: 'cos', value: an[i] })
    if (fmt(bn[i]) !== '0') terms.push({ n: i + 1, kind: 'sin', value: bn[i] })
  }

  return (
    <div className="expression-section lab-section">
      <div className="section-title">
        <span className="mp-icon-chip mp-icon-chip--primary" aria-hidden="true">
          <i className="uil uil-sigma" />
        </span>
        <span>Expresión matemática de la señal generada</span>
      </div>

      <h4 className="plot-title">Señal ideal (por tramos)</h4>
      <div className="math-block">
        <span className="math-lhs">
          <i>f</i>(<i>t</i>) =
        </span>
        <span className="math-cases">
          {pieces.map((piece) => (
            <span className="math-case" key={piece.k}>
              <span className="math-case-value">{fmt(piece.amp)}</span>
              <span className="math-case-cond">
                si {fmt(piece.start)} ≤ <i>t</i> &lt; {fmt(piece.end)}
              </span>
            </span>
          ))}
        </span>
      </div>
      <p className="section-help">
        Con periodo <i>T</i> = {fmt(T)}: <i>f</i>(<i>t</i> + <i>T</i>) = <i>f</i>(<i>t</i>).
      </p>

      <h4 className="plot-title">Reconstrucción con {harmonics} armónicos</h4>
      <div className="math-block math-series">
        <span className="math-lhs">
          <i>f</i>
          <sub>{harmonics}</sub>(<i>t</i>) =
        </span>
        <span>
          {fmt(a0 / 2)}
          {terms.map((term) => {
            const { sign, abs } = signed(term.value)
            return (
              <span key={`${term.kind}${term.n}`}>
                {' '}
                {sign} {abs} {term.kind}({term.n === 1 ? '' : `${term.n}·`}
                {w0Text}
                <i>t</i>)
              </span>
            )
          })}
          {an.length > SHOWN_HARMONICS ? <span> + …</span> : null}
        </span>
      </div>
      <p className="section-help">
        <i>ω</i>
        <sub>0</sub> = 2π/<i>T</i> = {w0Text} rad/s · <i>a</i>
        <sub>0</sub> = {fmt(a0)} · Se muestran los términos distintos de cero de los primeros{' '}
        {Math.min(SHOWN_HARMONICS, an.length)} armónicos.
      </p>

      <details className="coefficients">
        <summary>Ver coeficientes de los {an.length} armónicos</summary>
        <div className="table-scroll coefficients-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>n</th>
                <th>
                  a<sub>n</sub>
                </th>
                <th>
                  b<sub>n</sub>
                </th>
                <th>
                  A<sub>n</sub>
                </th>
                <th>
                  φ<sub>n</sub> (rad)
                </th>
              </tr>
            </thead>
            <tbody>
              {an.map((value, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{fmt(value, 6)}</td>
                  <td>{fmt(bn[i], 6)}</td>
                  <td>{fmt(magnitudes[i], 6)}</td>
                  <td>{fmt(phi[i], 6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

// Memo: el slider de armónicos re-renderiza la página y la tabla puede tener 3000 filas.
export const SignalExpression = memo(SignalExpressionView)
