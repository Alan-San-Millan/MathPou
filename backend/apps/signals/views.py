from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .domain.fourier import (
    EXAMPLE_PULSES,
    generate_pulse_signal,
    grafica_example_calculate,
    reconstruct_pulse_signal,
)
from .serializers import PulseRequestSerializer


class PulseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PulseRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data["datos"]
        result = generate_pulse_signal(datos)
        harmonics = serializer.validated_data.get("armonicos")
        if harmonics is not None:
            result["reconstruction"] = reconstruct_pulse_signal(datos, harmonics)
        return Response(result)


class ExampleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, graph_id):
        pair = EXAMPLE_PULSES.get(str(graph_id))
        if pair is None:
            return Response({"detail": "Invalid graph ID"}, status=400)
        amplitudes, times = pair
        return Response(grafica_example_calculate(amplitudes, times))
