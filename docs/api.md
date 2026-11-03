# API (contratos)

Base: `/api/…`. Header de auth: `Authorization: Bearer <access>`.

## Salud y auth

| Método | Ruta | Auth | Body / notas |
|--------|------|------|--------------|
| GET | `/api/health/` | no | ping |
| POST | `/api/auth/register/` | no | `{ username, email, password }` → tokens + user |
| POST | `/api/auth/token/` | no | `{ username, password }` → `{ access, refresh }`. El valor de `username` puede ser **nombre de usuario o correo** (case-insensitive en email). |
| POST | `/api/auth/token/refresh/` | no | `{ refresh }` |
| GET | `/api/auth/me/` | sí | usuario actual |
| POST | `/api/auth/logout/` | sí | `{ refresh }` (blacklist) |

## Señales

### Pulsos

```
POST /api/signals/pulse/
{ "datos": [[0, t0], [A1, t1], [A2, t2], ...], "armonicos": 50 }
→ { time, signal, T, w0, reconstruction?: { time, signal, a0, an, bn, magnitudes, phi } }
```

`T = tₙ − t₀`. `armonicos` es opcional (entero de 1 a 3000); si viene, la respuesta incluye `reconstruction`: la serie truncada de t₀ a t₀ + 4T.

Implementación: `generate_pulse_signal` y `reconstruct_pulse_signal` en `fourier.py`.

### Ejemplos 1–4

```
GET /api/signals/examples/<1|2|3|4>/
→ { amplitudes, phases, time, signal }
```

`phases` aquí son coeficientes **bₙ** (nombre histórico del JSON). No “arregles” el nombre sin actualizar el front.

Vectores: `EXAMPLE_PULSES` en `fourier.py`.
