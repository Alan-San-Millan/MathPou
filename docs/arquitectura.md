# Arquitectura

MathPou es un monorepo chico: una API Django y una SPA React. En Render van como dos servicios porque el front es estático y el back necesita proceso + JWT.

```
MathPou/
  backend/     Django 6 + DRF + SimpleJWT + numpy
  frontend/    React + Vite + TypeScript (pnpm)
  docs/        estas notas
  render.yaml  blueprint de los dos servicios
```

## Por qué JWT y no cookies de sesión

El static site y el API viven en orígenes distintos en Render. Con cookies cross-site te peleas con CORS/`SameSite`. JWT en `Authorization: Bearer` es más directo para esta tesis.

Tokens en `localStorage` (`mathpou.access` / `mathpou.refresh`). El cliente intenta refresh una vez si ve un 401.

## Capas del backend

```
apps/accounts/     registro, /me, logout (blacklist refresh)
apps/signals/      pulsos + ejemplos
  domain/fourier.py   la matemática (numpy puro)
  views.py            validan JSON y delegan
config/settings/
  local.py            SQLite, DEBUG
  production.py       exige SECRET_KEY + DATABASE_URL
```

Regla de oro: **no** metas `np.linspace` en las views. Si hay que tocar la fórmula, toca `fourier.py` y corre `pytest`.

## Capas del frontend

```
src/app/            AuthProvider
src/features/       una carpeta por pantalla (+ su CSS y sketches)
src/shared/api/     client.ts (fetch + JWT)
src/shared/ui/      layout + sidebar
src/styles/         solo global: tokens, motion, app-shell
src/index.css       entrada global (importa tokens + motion)
```

Las gráficas interactivas usan **p5** en instance mode (`timeDomainPlot.js`, `frequencySketch.js`). Cada página que monta un sketch debe `remove()` al desmontar (StrictMode en dev monta dos veces).

CSS de vista = al lado del componente (`time-domain.css`, `auth.css`, …). Nada de `prueba_*` ni `styleLogin`.

## Deploy (idea general)

- `mathpou-api`: gunicorn en `0.0.0.0:$PORT`, health en `/api/health/`
- `mathpou-web`: `pnpm build`, publish `dist`, rewrite SPA

Env del front (`VITE_API_URL`) se hornea en el build. Cambiarla después en el panel sin rebuild no alcanza.

## Qué no volver a hacer

- Restaurar la carpeta `loginSignup` (monolito viejo).
- Hardcodear passwords en scripts de build.
- Mandar la matriz de pulsos sin `[0, t0]`.
- Usar npm en el front (el repo está en pnpm).
