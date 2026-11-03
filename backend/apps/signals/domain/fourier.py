"""Fourier / pulse math extracted from the original Django views.

Keep these formulas as they were. If a number changes, it is a port bug,
not a nicer algorithm.

Notas rápidas para quien abre el archivo a las 2am:
- generate_pulse_signal → lo que usa /api/signals/pulse/ (escalera muestreada).
- grafica_example_calculate → ejemplos 1–4 de la galería.
- calculate_signal_data → útil en tests / futuro; el front hoy no lo llama.
- En grafica_example_calculate, la clave "phases" en realidad trae bₙ.
  Lo dejamos así porque el contrato JSON ya salió con ese nombre.
"""

import numpy as np

# Vectores de la tesis. Si cambias uno, actualiza el test que lo fija.
EXAMPLE_PULSES = {
    "1": ([0, 1, -2, 10], [0, 1, 3, 6]),
    "2": ([0, 2, -3, 5], [0, 2, 4, 7]),
    "3": ([0, 1, -1, 4], [0, 1.5, 3, 5]),
    "4": ([0, 3, -2, 8], [0, 1, 2.5, 6]),
}

DEFAULT_FOURIER_MATRIX = [[0, 0], [1, 1], [-2, 3], [10, 6]]


def grafica_example_calculate(amplitudes, times):
    npulses = len(amplitudes) - 1
    T = times[npulses]
    w0 = 2 * np.pi / T
    a0 = 0

    for k in range(1, npulses + 1):
        a0 += (2 / T) * amplitudes[k] * (times[k] - times[k - 1])

    f = a0 / 2
    t = np.linspace(0, 2 * T, 1024 * 2 * int(np.pi))

    an_values = []
    bn_values = []
    for n in range(1, 101):
        an, bn = 0, 0
        for k in range(1, npulses + 1):
            an += (1 / (n * np.pi)) * amplitudes[k] * (
                np.sin(n * w0 * times[k]) - np.sin(n * w0 * times[k - 1])
            )
            bn -= (1 / (n * np.pi)) * amplitudes[k] * (
                np.cos(n * w0 * times[k]) - np.cos(n * w0 * times[k - 1])
            )
        an_values.append(an)
        bn_values.append(bn)
        f += an * np.cos(n * w0 * t) + bn * np.sin(n * w0 * t)

    return {
        "amplitudes": [float(v) for v in an_values],
        "phases": [float(v) for v in bn_values],
        "time": [float(v) for v in t],
        "signal": [float(v) for v in f],
    }


def calculate_signal_data(matriz=None):
    if matriz is None:
        matriz = DEFAULT_FOURIER_MATRIX

    A = [row[0] for row in matriz]
    at = [row[1] for row in matriz]
    npulses = len(A) - 1

    if npulses <= 0:
        return {
            "amplitudes": [A[0] if len(A) > 0 else 0],
            "phases": [0],
            "time": [0, 1],
            "signal": [A[0] if len(A) > 0 else 0, A[0] if len(A) > 0 else 0],
            "T": 1,
            "w0": 0,
        }

    T = at[npulses]
    w0 = 2 * np.pi / T if T > 0 else 0

    a0 = A[0]
    for k in range(1, npulses + 1):
        a0 += (2 / T) * A[k] * (at[k] - at[k - 1])

    f = a0 / 2
    t = np.linspace(0, 2 * T, 1024 * 2 * int(np.pi))

    an_values = [a0]
    bn_values = [0]

    for n in range(1, 101):
        an, bn = 0, 0
        for k in range(1, npulses + 1):
            an += (2 / T) * A[k] * (at[k] - at[k - 1]) * np.cos(n * w0 * at[k - 1])
            bn += (2 / T) * A[k] * (at[k] - at[k - 1]) * np.sin(n * w0 * at[k - 1])

        an_values.append(an)
        bn_values.append(bn)
        f += an * np.cos(n * w0 * t) + bn * np.sin(n * w0 * t)

    return {
        "amplitudes": [float(v) for v in an_values],
        "phases": [float(v) for v in bn_values],
        "time": [float(v) for v in t],
        "signal": [float(v) for v in f],
        "T": float(T),
        "w0": float(w0),
    }


def reconstruct_pulse_signal(matriz, harmonics, periods=4, num_samples=4000):
    """Serie truncada de un tren de pulsos, mismas fórmulas que tren_n_pulsos.m.

    El intervalo de integración es [t0, tn], así que T = tn - t0 aunque t0 sea negativo.
    """
    amplitudes = np.array([row[0] for row in matriz], dtype=float)
    times = np.array([row[1] for row in matriz], dtype=float)
    t0 = times[0]
    T = times[-1] - t0
    t = np.linspace(t0, t0 + periods * T, num_samples)
    if len(matriz) < 2 or T <= 0:
        return {
            "time": [float(v) for v in t],
            "signal": [0.0] * len(t),
            "a0": 0.0,
            "an": [],
            "bn": [],
            "magnitudes": [],
            "phi": [],
        }

    w0 = 2 * np.pi / T
    A = amplitudes[1:]
    t_start = times[:-1]
    t_end = times[1:]

    a0 = float(np.sum((2 / T) * A * (t_end - t_start)))
    f = np.full_like(t, a0 / 2)
    an_values = []
    bn_values = []
    for n in range(1, harmonics + 1):
        an = np.sum((1 / (n * np.pi)) * A * (np.sin(n * w0 * t_end) - np.sin(n * w0 * t_start)))
        bn = -np.sum((1 / (n * np.pi)) * A * (np.cos(n * w0 * t_end) - np.cos(n * w0 * t_start)))
        an_values.append(float(an))
        bn_values.append(float(bn))
        f += an * np.cos(n * w0 * t) + bn * np.sin(n * w0 * t)

    an_arr = np.array(an_values)
    bn_arr = np.array(bn_values)
    return {
        "time": [float(v) for v in t],
        "signal": [float(v) for v in f],
        "a0": a0,
        "an": an_values,
        "bn": bn_values,
        # Forma amplitud-fase como pulso_basico.m: Aₙ = √(aₙ² + bₙ²), φₙ = −atan2(bₙ, aₙ).
        "magnitudes": [float(v) for v in np.sqrt(an_arr**2 + bn_arr**2)],
        "phi": [float(v) for v in -np.arctan2(bn_arr, an_arr)],
    }


def generate_pulse_signal(matriz):
    if not matriz:
        return {"time": [], "signal": [], "T": 0, "w0": 0}

    amplitudes = [row[0] for row in matriz]
    times = [row[1] for row in matriz]

    T = times[-1] - times[0] if times else 0
    w0 = 2 * np.pi / T if T > 0 else 0

    num_samples = 1000
    t_max = max(times) if times else 1
    t = np.linspace(min(0, times[0]), t_max + 1, num_samples)

    signal = np.zeros_like(t)

    for i, current_t in enumerate(t):
        for j in range(len(times)):
            if current_t >= times[j]:
                signal[i] = amplitudes[j]
            else:
                break

    return {
        "time": [float(v) for v in t],
        "signal": [float(v) for v in signal],
        "T": float(T),
        "w0": float(w0),
    }
