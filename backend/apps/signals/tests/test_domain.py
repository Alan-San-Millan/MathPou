from apps.signals.domain.fourier import (
    DEFAULT_FOURIER_MATRIX,
    EXAMPLE_PULSES,
    calculate_signal_data,
    generate_pulse_signal,
    grafica_example_calculate,
)


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
