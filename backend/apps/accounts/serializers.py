from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Ya existe una cuenta con ese correo.")
        return email

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    El campo sigue llamándose `username` en el JSON (SimpleJWT),
    pero acepta username o correo. Si viene un email, resolvemos al user real.
    """

    def validate(self, attrs):
        login_id = (attrs.get(self.username_field) or "").strip()
        if "@" in login_id:
            user = User.objects.filter(email__iexact=login_id).first()
            if user is not None:
                attrs[self.username_field] = user.get_username()
        return super().validate(attrs)
