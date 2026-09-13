from django.urls import path

from .views import ExampleView, PulseView

urlpatterns = [
    path("pulse/", PulseView.as_view(), name="pulse"),
    path("examples/<str:graph_id>/", ExampleView.as_view(), name="example"),
]
