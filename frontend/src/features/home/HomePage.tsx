import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './home.css'

// Landing pública. El hero es marca + una idea + CTA; el resto baja a explicación.
export function HomePage() {
  const [sticky, setSticky] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      setSticky(document.documentElement.scrollTop > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function closeMenu() {
    setMenuOpen(false)
    document.body.style.overflow = 'auto'
  }

  function openMenu() {
    setMenuOpen(true)
    document.body.style.overflow = 'hidden'
  }

  return (
    <div className="home-page">
      <div className={`scroll-button${sticky ? ' is-visible' : ''}`}>
        <a href="#home" aria-label="Volver arriba" className="mp-press">
          <i className="fas fa-arrow-up" aria-hidden="true" />
        </a>
      </div>

      <nav className={`home-nav${sticky ? ' sticky' : ''}`} aria-label="Principal">
        <div className={`navbar${menuOpen ? ' active' : ''}`}>
          <div className="logo">
            <a href="#home">
              <i className="uil uil-chart-line logo-mark" aria-hidden="true" />
              MathPou
            </a>
          </div>
          <ul className="menu">
            <li>
              <a href="#home" onClick={closeMenu}>
                <i className="uil uil-estate" aria-hidden="true" /> Inicio
              </a>
            </li>
            <li>
              <a href="#labs" onClick={closeMenu}>
                <i className="uil uil-flask" aria-hidden="true" /> Laboratorio
              </a>
            </li>
            <li>
              <a href="#about" onClick={closeMenu}>
                <i className="uil uil-book-open" aria-hidden="true" /> Acerca
              </a>
            </li>
            <li>
              <a href="#contact" onClick={closeMenu}>
                <i className="uil uil-envelope" aria-hidden="true" /> Contacto
              </a>
            </li>
            <div
              className="cancel-btn"
              onClick={closeMenu}
              role="button"
              tabIndex={0}
              aria-label="Cerrar menú"
              onKeyDown={(e) => e.key === 'Enter' && closeMenu()}
            >
              <i className="fas fa-times" aria-hidden="true" />
            </div>
          </ul>
        </div>
        <div
          className="menu-btn"
          onClick={openMenu}
          role="button"
          tabIndex={0}
          aria-label="Abrir menú"
          onKeyDown={(e) => e.key === 'Enter' && openMenu()}
          style={{ opacity: menuOpen ? 0 : 1, pointerEvents: menuOpen ? 'none' : 'auto' }}
        >
          <i className="fas fa-bars" aria-hidden="true" />
        </div>
      </nav>

      <section className="home" id="home">
        <div className="home-content mp-enter">
          <div className="text">
            <div className="text-one">
              <i className="uil uil-university" aria-hidden="true" /> Laboratorio de señales
            </div>
            <div className="text-two">Aprende Fourier</div>
            <div className="text-three">MathPou</div>
            <div className="text-four">
              Simulador educativo para analizar pulsos en el tiempo y sus armónicos en frecuencia.
            </div>
          </div>
          <div className="button">
            <Link to="/login" id="loginHome" className="mp-press mp-cta-hint">
              <i className="uil uil-signin" aria-hidden="true" />
              Entrar al laboratorio
            </Link>
          </div>
        </div>
      </section>

      <section className="labs-preview" id="labs">
        <div className="content">
          <div className="title mp-enter">
            <span>Qué puedes hacer dentro</span>
          </div>
          <div className="labs-grid mp-stagger">
            <article className="lab-card mp-lift">
              <span className="mp-icon-chip" aria-hidden="true">
                <i className="uil uil-clock" />
              </span>
              <h3>Dominio del tiempo</h3>
              <p>Armas la escalera de pulsos, miras T y ω₀, y ves cómo queda la señal periódica.</p>
            </article>
            <article className="lab-card mp-lift">
              <span className="mp-icon-chip" aria-hidden="true">
                <i className="uil uil-graph-bar" />
              </span>
              <h3>Dominio de la frecuencia</h3>
              <p>Arrastras amplitudes y fases. La suma abajo es la reconstrucción en vivo.</p>
            </article>
            <article className="lab-card mp-lift">
              <span className="mp-icon-chip" aria-hidden="true">
                <i className="uil uil-books" />
              </span>
              <h3>Ejemplos típicos</h3>
              <p>Cuadrada, triangular, sierra y más, con la fórmula al lado de la gráfica.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="content">
          <div className="title">
            <span>Acerca del proyecto</span>
          </div>
          <div className="about-details">
            <div className="left mp-enter">
              <img src="/img/estudiantes2.png" alt="Estudiantes trabajando con señales y gráficas" />
            </div>
            <div className="right mp-enter-slow">
              <div className="topic">
                <i className="uil uil-lightbulb-alt" aria-hidden="true" /> De la forma de onda a la serie
              </div>
              <p>
                MathPou está pensado para estudiantes de ingeniería que necesitan ver —no solo
                memorizar— cómo una señal periódica se descompone en senos y cosenos. Puedes armar
                pulsos en el dominio del tiempo, explorar amplitudes y fases en frecuencia, y
                comparar ejemplos clásicos de series de Fourier.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="contact" id="contact">
        <div className="footerContainer">
          <a href="https://www.facebook.com/" aria-label="Facebook" className="mp-lift">
            <i className="fa-brands fa-facebook" aria-hidden="true" />
          </a>
          <a href="https://www.instagram.com/" aria-label="Instagram" className="mp-lift">
            <i className="fa-brands fa-instagram" aria-hidden="true" />
          </a>
          <a href="https://twitter.com/home" aria-label="Twitter" className="mp-lift">
            <i className="fa-brands fa-twitter" aria-hidden="true" />
          </a>
          <a href="https://www.youtube.com/" aria-label="YouTube" className="mp-lift">
            <i className="fa-brands fa-youtube" aria-hidden="true" />
          </a>
        </div>
        <div className="footerBottom">
          <p>
            © {new Date().getFullYear()} · Proyecto de tesis · <span className="designer">MathPou</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
