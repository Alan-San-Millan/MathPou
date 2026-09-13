# MathPou

Simulador educativo de series de Fourier (tesis). API Django + SPA React en dos servicios Render.

- Arranque y reglas críticas: [AGENTS.md](AGENTS.md)
- Arquitectura, vistas y API: [docs/](docs/)
- Matemática de las gráficas (sin código): [docs/matematica.md](docs/matematica.md)

## Arranque local

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # o source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

```bash
cd frontend
pnpm install
pnpm dev
```

Abre http://localhost:5173 (**pnpm**, no npm). El login acepta usuario o correo.

## Laboratorio

| Ruta | Pantalla |
|------|----------|
| `/app/tiempo` | Dominio del tiempo |
| `/app/frecuencia` | Dominio de la frecuencia |
| `/app/ejemplos` | Ejemplos de series típicas |
