from rest_framework import serializers


class PulseRequestSerializer(serializers.Serializer):
    datos = serializers.ListField(
        child=serializers.ListField(
            child=serializers.FloatField(),
            min_length=2,
            max_length=2,
        ),
        allow_empty=False,
    )
    armonicos = serializers.IntegerField(min_value=1, max_value=3000, required=False)
