from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .domain.fourier import EXAMPLE_PULSES, generate_pulse_signal, grafica_example_calculate
from .serializers import PulseRequestSerializer


class PulseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PulseRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = generate_pulse_signal(serializer.validated_data["datos"])
        return Response(result)


class ExampleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, graph_id):
        pair = EXAMPLE_PULSES.get(str(graph_id))
        if pair is None:
            return Response({"detail": "Invalid graph ID"}, status=400)
        amplitudes, times = pair
        return Response(grafica_example_calculate(amplitudes, times))
