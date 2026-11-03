import numpy as np

from apps.signals.domain.fourier import (
    DEFAULT_FOURIER_MATRIX,
    EXAMPLE_PULSES,
    calculate_signal_data,
    generate_pulse_signal,
    grafica_example_calculate,
    reconstruct_pulse_signal,
)


def test_reconstruction_matches_pulso_basico_matlab():
    # pulso_basico.m: T=4, a0=1, an=0, bn=-(1/(n*pi))*((-1)^n - 1)
    harmonics = 50
    data = reconstruct_pulse_signal([[0, 0], [1, 2], [0, 4]], harmonics)
    t = np.array(data["time"])
    expected = np.full_like(t, 0.5)
    w0 = 2 * np.pi / 4
    for n in range(1, harmonics + 1):
        bn = (-1 / (n * np.pi)) * ((-1) ** n - 1)
        expected += bn * np.sin(n * w0 * t)
    assert np.allclose(data["signal"], expected, atol=1e-9)
    assert abs(data["a0"] - 1) < 1e-12
    assert len(data["an"]) == len(data["bn"]) == harmonics
    assert np.allclose(data["an"], 0, atol=1e-12)
    expected_bn = [(-1 / (n * np.pi)) * ((-1) ** n - 1) for n in range(1, harmonics + 1)]
    assert np.allclose(data["bn"], expected_bn, atol=1e-12)
    assert abs(data["magnitudes"][0] - 2 / np.pi) < 1e-12
    assert abs(data["phi"][0] + np.pi / 2) < 1e-12


def test_reconstruction_starts_at_t0_and_is_shift_invariant():
    base = reconstruct_pulse_signal([[0, 0], [1, 6], [2, 8], [-1, 10]], 30)
    shifted = reconstruct_pulse_signal([[0, -5], [1, 1], [2, 3], [-1, 5]], 30)
    assert shifted["time"][0] == -5
    assert abs(shifted["time"][-1] - 35) < 1e-9
    assert np.allclose(base["signal"], shifted["signal"], atol=1e-9)


def test_reconstruction_approaches_pulse_amplitudes():
    data = reconstruct_pulse_signal([[0, -5], [1, 1], [2, 3], [-1, 5]], 500)
    t = np.array(data["time"])
    f = np.array(data["signal"])
    for center, amp in [(-2, 1), (2, 2), (4, -1)]:
        assert abs(f[np.argmin(abs(t - center))] - amp) < 0.05


def test_example_one_returns_signal_and_coefficients():
    amplitudes, times = EXAMPLE_PULSES["1"]
    data = grafica_example_calculate(amplitudes, times)
    assert set(data) >= {"amplitudes", "phases", "time", "signal"}
    assert len(data["amplitudes"]) == 100
    assert len(data["phases"]) == 100
    assert len(data["time"]) == len(data["signal"])
    assert len(data["signal"]) == 1024 * 2 * 3


def test_example_ids_match_original_vectors():
    assert EXAMPLE_PULSES["1"] == ([0, 1, -2, 10], [0, 1, 3, 6])
    assert EXAMPLE_PULSES["2"] == ([0, 2, -3, 5], [0, 2, 4, 7])
    assert EXAMPLE_PULSES["3"] == ([0, 1, -1, 4], [0, 1.5, 3, 5])
    assert EXAMPLE_PULSES["4"] == ([0, 3, -2, 8], [0, 1, 2.5, 6])


def test_default_fourier_matrix_shape():
    data = calculate_signal_data(DEFAULT_FOURIER_MATRIX)
    assert data["T"] == 6
    assert abs(data["w0"] - (2 * 3.141592653589793 / 6)) < 1e-9
    assert len(data["amplitudes"]) == 101
    assert data["phases"][0] == 0


def test_pulse_signal_uses_last_time_as_period():
    matriz = [[0, 0], [5, 1], [2, 3]]
    data = generate_pulse_signal(matriz)
    assert data["T"] == 3
    assert len(data["time"]) == 1000
    assert len(data["signal"]) == 1000
    assert data["signal"][0] == 0
