import './dashboard.css'

// Tarjetas de conceptos del tablero. No navegan solas: el menú lateral es el mapa del lab.
const cards = [
  {
    className: 'square',
    icon: 'fas fa-wave-square',
    title: 'Pulso cuadrado',
    text: 'Cambia de golpe entre dos niveles. Es un buen primer ejemplo porque su espectro tiene muchos armónicos impares.',
  },
  {
    className: 'triangular',
    icon: 'fas fa-chart-area',
    title: 'Pulso triangular',
    text: 'Sube y baja de forma lineal. Suele verse más “suave” que el cuadrado: los armónicos altos decaen más rápido.',
  },
  {
    className: 'combined',
    icon: 'fas fa-chart-line',
    title: 'Pulso combinado',
    text: 'Varias amplitudes y anchos en un mismo periodo. Es lo que construyes en el dominio del tiempo.',
  },
  {
    className: 'harmonics',
    icon: 'uil uil-headphones',
    title: 'Armónicos',
    text: 'Cada término n·ω₀ aporta una frecuencia. Arrastrar Aₙ y φₙ en frecuencia te muestra su efecto en la suma.',
  },
  {
    className: 'fourier',
    icon: 'fas fa-square-root-alt',
    title: 'Serie de Fourier',
    text: 'Escribe una señal periódica como suma de senos y cosenos. Aquí la usamos para enseñar, no para ocultar la fórmula.',
  },
  {
    className: 'reconstruction',
    icon: 'fas fa-project-diagram',
    title: 'Reconstrucción',
    text: 'Con más armónicos la forma se acerca a la original. Los ejemplos de la galería muestran ese límite en la práctica.',
  },
]

export function DashboardPage() {
  return (
    <section className="dashboard dashboard-page mp-enter">
      <div className="dash-content">
        <div className="overview">
          <div className="title">
            <span className="mp-icon-chip" aria-hidden="true">
              <i className="uil uil-book-open" />
            </span>
            <span className="text">Conceptos del laboratorio</span>
          </div>
          <p className="dashboard-intro">
            Empieza por aquí si es tu primera sesión. Luego pasa al dominio del tiempo o de la
            frecuencia desde el menú lateral.
          </p>
          <div className="boxes-container mp-stagger">
            {cards.map((card) => (
              <article className={`signal-box mp-lift ${card.className}`} key={card.title}>
                <div className="box-header">
                  <span className="mp-icon-chip mp-icon-chip--primary" aria-hidden="true">
                    <i className={card.icon} />
                  </span>
                  <h2>{card.title}</h2>
                </div>
                <div className="box-content">
                  <p>{card.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
