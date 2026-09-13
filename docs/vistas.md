# Vistas (mapa humano)

Rutas reales del router. Si solo vas a tocar UI, empieza aquí.

## Públicas

### `/` — Home

Landing. Hero con marca **MathPou**, bloque “Qué puedes hacer” (tiempo / frecuencia / ejemplos), acerca y footer.

Archivo: `frontend/src/features/home/HomePage.tsx` (+ `home.css`)

### `/login` y `/signup`

Misma componente `AuthPage` con `mode` (+ `auth.css`).

- **Login:** campo “Usuario o correo” → `POST /api/auth/token/` (la clave JSON sigue siendo `username`, pero acepta email).
- **Registro:** username + email + password → `POST /api/auth/register/`.
- Si ya hay sesión, redirige a `/app`.

## Laboratorio (requieren JWT)

Layout: sidebar fija + `Outlet` (`app-shell.css`). Sin token → `/login`.

### `/app` — Conceptos

Seis tarjetas educativas (`dashboard.css`). No son links; el menú lateral es la navegación.

### `/app/tiempo` — Dominio del tiempo

| Bloque | Idea |
|--------|------|
| Parámetros | t₀ + pares (Aₖ, tₖ) |
| Agregar pulso | Nuevo par (máx. 10), exige campos llenos |
| Generar | Preview local + `POST /api/signals/pulse/` |
| Tabla | Duraciones, T, ω₀ |
| Plot | Escalera p5 (`timeDomainPlot.js`) |

La matriz que viaja al API **incluye** `[0, t0]`. Estilos: `time-domain.css`.

### `/app/frecuencia` — Dominio de la frecuencia

Editor A₀–A₁₁ + fases. Todo en el navegador (`frequencySketch.js` + `frequency-domain.css`). Los botones “Cargar” no tocan el API; los números están en `EXAMPLE_PRESETS`.

### `/app/ejemplos` — Galería

| Tarjetas | Fuente |
|----------|--------|
| 1–4 | `GET /api/signals/examples/<id>/` + p5 |
| 5–6 | Imágenes estáticas en `public/img/` |

Estilos: `examples.css`.

## Motion / iconos

Clases en `styles/motion.css` (`mp-enter`, `mp-stagger`, `mp-lift`, …). Respetan `prefers-reduced-motion`. Iconos: Unicons + Font Awesome (ya en `index.html`).

## Convención de nombres (front)

| Antes (legacy) | Ahora |
|----------------|-------|
| `prueba_data.css` | `features/time-domain/time-domain.css` |
| `prueba_grafica.css` | `features/frequency-domain/frequency-domain.css` |
| `grafica_view.css` | `features/examples/examples.css` |
| `styleLogin.css` | `features/auth/auth.css` |
| `styles/index.css` | `features/dashboard/dashboard.css` |
| `layout.css` | `styles/app-shell.css` |
| `stepPlot.js` | `timeDomainPlot.js` |
| `pulseSketch.js` | `frequencySketch.js` |

`styles/` solo guarda lo **global** (tokens, motion, shell). El CSS de una vista va al lado del componente.
