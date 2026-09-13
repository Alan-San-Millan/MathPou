# MathPou — guía rápida para quien continúa

Si llegaste a seguir la tesis: el monolito Django ya no está. Ahora es API + SPA. Esta página es el atajo; el detalle vive en [`docs/`](docs/).

| Quieres… | Lee |
|----------|-----|
| Cómo está partido el repo | [docs/arquitectura.md](docs/arquitectura.md) |
| Qué hace cada pantalla / sección | [docs/vistas.md](docs/vistas.md) |
| Cómo se generan las gráficas (mates) | [docs/matematica.md](docs/matematica.md) |
| Contratos JSON | [docs/api.md](docs/api.md) |

> `loginSignup/` no existe más. No la restaures.

---

## En una frase

Simulador educativo de series de Fourier: pulsos en el tiempo, armónicos en frecuencia, ejemplos típicos.

| Ruta | Qué es |
|------|--------|
| `/` | Landing |
| `/login`, `/signup` | Auth JWT (login con usuario **o** correo) |
| `/app` | Conceptos |
| `/app/tiempo` | Constructor de pulsos + API |
| `/app/frecuencia` | Editor A₀–A₁₁ (solo cliente) |
| `/app/ejemplos` | Galería 1–4 API, 5–6 estáticas |

---

## Arranque local

Python 3.12+, Node 20+, **pnpm**.

```bash
# API
cd backend && python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt && python manage.py migrate && python manage.py runserver
```

```bash
# SPA
cd frontend && pnpm install && pnpm dev
```

http://localhost:5173 — Vite proxea `/api` → `8000`.

```bash
cd backend && pytest
cd frontend && pnpm build
```

---

## Tres reglas que duelen si se rompen

1. El POST de pulsos manda la matriz **con** `[0, t0]`. Sin eso el periodo sale mal.
2. Los ejemplos del API deben traer `signal`.
3. La matemática vive en `backend/apps/signals/domain/fourier.py`. No “mejores” números a ojo: hay tests.

Presets de frecuencia (`frequencySketch.js`) y ejemplos de galería (`EXAMPLE_PULSES`) son **dos listas**. Si cambias una, revisa la otra.

---

## Diseño

Tokens globales: `frontend/src/styles/tokens.css` (+ `motion.css`, `app-shell.css`).  
CSS de cada pantalla vive **junto** a la feature (`features/.../time-domain.css`, etc.).

---

## Deploy

`render.yaml`: API (gunicorn `0.0.0.0:$PORT`) + static (`pnpm build`).  
Env API: `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`.  
Env build front: `VITE_API_URL` (se hornea en el build).

---

## Si te atoras

1. `/api/health/` caído → backend abajo.
2. Login falla con API arriba → CORS o `VITE_API_URL` mal en prod.
3. Dos canvas en frecuencia → falta `remove()` del sketch.
4. Números raros → `pytest` + `fourier.py`.

Cuando dudes entre bonito y la tesis, gana la tesis.
