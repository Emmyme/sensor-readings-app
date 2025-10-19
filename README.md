# Sensor Management System

A full-stack web application for managing sensors and their readings, built with Django Ninja (backend) and Next.js (frontend).

## How to Run Locally

### Prerequisites
- Docker and Docker Compose
- Make

### Setup
```bash
git clone https://github.com/Emmyme/sensor-readings-app
cd sensor-readings-app

# Start everything
make up

# Run migrations
make migrate

# Load sample data
make seed
```

### Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs

### Default Login
- **Email**: `tester@example.com`
- **Password**: `testpassword123`

## Run Tests

```bash
make test
```

## API Overview

All endpoints require authentication (except auth endpoints). Base URL: `/api`

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/token/` - Login (get access token)
- `POST /api/auth/token/refresh/` - Refresh token

### Sensors
- `GET /api/sensors/` - List sensors (with pagination, search, filtering)
- `POST /api/sensors/` - Create sensor
- `GET /api/sensors/{id}/` - Get sensor details
- `PUT /api/sensors/{id}/` - Update sensor
- `DELETE /api/sensors/{id}/` - Delete sensor

### Readings
- `GET /api/sensors/{id}/readings/` - List readings for a sensor
- `POST /api/sensors/{id}/readings/` - Create reading

### Query Parameters
- **Sensors**: `page`, `page_size`, `search`, `model`, `sort_by`
- **Readings**: `page`, `page_size`, `timestamp_from`, `timestamp_to`
