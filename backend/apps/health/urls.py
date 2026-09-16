from django.urls import path

from . import views

app_name = 'health'

urlpatterns = [
    path('', views.HealthView.as_view(), name='health'),
    path('live', views.LivenessView.as_view(), name='health-live'),
    path('ready', views.ReadinessView.as_view(), name='health-ready'),
]
