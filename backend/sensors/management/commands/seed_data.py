from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from sensors.models import Sensor, Reading
from datetime import datetime
from decimal import Decimal
import csv
import os
from django.conf import settings

class Command(BaseCommand):
    help = 'Create seed data for the sensors app'

    def handle(self, *args, **options):
        # Create test user
        user, created = User.objects.get_or_create(
            email='tester@example.com',
            username='tester'
        )
        if created:
            user.set_password('testpassword123')
            user.save()
            self.stdout.write(f'Created user: {user.username}')
        else:
            self.stdout.write(f'User already exists: {user.username}')

        # Create the 5 specified sensors
        sensors_data = [
            {'name': 'device-001', 'model': 'EnviroSense'},
            {'name': 'device-002', 'model': 'ClimaTrack'},
            {'name': 'device-003', 'model': 'AeroMonitor'},
            {'name': 'device-004', 'model': 'HydroTherm'},
            {'name': 'device-005', 'model': 'EcoStat'},
        ]

        sensors = {}
        for sensor_data in sensors_data:
            sensor, created = Sensor.objects.get_or_create(
                owner=user,
                name=sensor_data['name'],
                defaults={
                    'model': sensor_data['model'],
                    'description': f'Sensor {sensor_data["name"]} - {sensor_data["model"]}'
                }
            )
            sensors[sensor_data['name']] = sensor
            if created:
                self.stdout.write(f'Created sensor: {sensor.name}')
            else:
                self.stdout.write(f'Sensor already exists: {sensor.name}')

        # Load CSV
        csv_file_path = os.path.join(settings.BASE_DIR, 'sensor_readings_wide.csv')
        
        if not os.path.exists(csv_file_path):
            self.stdout.write(
                self.style.WARNING(f'CSV file not found at {csv_file_path}')
            )
            self.stdout.write('Please place sensor_readings_wide.csv in the project root directory')
            return

        # Load readings from CSV 
        readings_created = 0
        readings_skipped = 0
        
        with open(csv_file_path, 'r') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                # Parse timestamp
                timestamp_str = row['timestamp']
                if 'T' in timestamp_str:
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                else:
                    timestamp = datetime.fromisoformat(timestamp_str)
                
                # Get device_id from CSV
                device_id = row['device_id']
                
                # Find matching sensor
                if device_id in sensors:
                    sensor = sensors[device_id]
                    
                    # Create reading
                    reading, created = Reading.objects.get_or_create(
                        sensor=sensor,
                        timestamp=timestamp,
                        defaults={
                            'temperature': Decimal(row['temperature']),
                            'humidity': Decimal(row['humidity'])
                        }
                    )
                    
                    if created:
                        readings_created += 1
                    else:
                        readings_skipped += 1
                else:
                    self.stdout.write(f'Warning: Device {device_id} not found in sensors')

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {readings_created} readings from CSV!')
        )
        if readings_skipped > 0:
            self.stdout.write(f'Skipped {readings_skipped} existing readings')
        self.stdout.write(
            self.style.SUCCESS('Seed data creation complete!')
        )