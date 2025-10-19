from django.db import models
from django.contrib.auth.models import User

class Sensor(models.Model):
    id = models.AutoField(primary_key=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sensors')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    model = models.CharField(max_length=100)
    
    
    def __str__(self):
        return f"{self.name} ({self.model})"

class Reading(models.Model):
    id = models.AutoField(primary_key=True)
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, related_name='readings')
    temperature = models.DecimalField(max_digits=5, decimal_places=2, help_text="Temperature in Celsius")
    humidity = models.DecimalField(max_digits=5, decimal_places=2, help_text="Humidity percentage")
    timestamp = models.DateTimeField()
    
    class Meta:
        ordering = ['-timestamp']
        unique_together = ['sensor', 'timestamp']
        indexes = [
            models.Index(fields=['sensor', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.sensor.name} - {self.timestamp}"