import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/AuthProvider'
import '../../styles/app-shell.css'

const links = [
  { to: '/app', label: 'Inicio', icon: 'uil uil-estate', end: true },
  { to: '/app/tiempo', label: 'Dominio en el tiempo', icon: 'uil uil-chart' },
  { to: '/app/frecuencia', label: 'Dominio en la frecuencia', icon: 'uil uil-graph-bar' },
  { to: '/app/ejemplos', label: 'Ejemplos de series', icon: 'uil uil-books' },
]

export function AppSidebar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  async function onLogout() {
    await logout()
    navigate('/')
  }

  return (
    <nav id="sidebar" aria-label="Navegación del laboratorio">
      <div className="logo-name">
        <span className="logo_name">MathPou</span>
        <span className="logo-sub">{user?.username ?? 'Laboratorio'}</span>
      </div>
      <div className="menu-items">
        <ul className="nav-links">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.end} aria-label={link.label} title={link.label}>
                <i className={link.icon} aria-hidden="true" />
                <span className="link-name">{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <ul className="logout-mode">
          <li>
            <button type="button" onClick={onLogout} aria-label="Cerrar sesión">
              <i className="uil uil-signout" aria-hidden="true" />
              <span className="link-name">Salir</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}
