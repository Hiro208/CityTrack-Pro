# API Documentation

This document provides an interview-friendly overview of the backend API design, request/response contracts, and auth model.

- Base URL: `http://localhost:5001`
- API Prefix: `/api`
- Content-Type: `application/json`
- Auth: `Authorization: Bearer <JWT>` for protected routes

## 1) Health Check

### GET `/health`
Checks server + database connectivity.

**Response 200**
```json
{
  "status": "UP",
  "db_time": "2026-02-15T13:21:07.000Z",
  "timestamp": "2026-02-15T13:21:07.123Z"
}
```

---

## 2) Vehicles

### GET `/api/vehicles`
Returns latest vehicle positions for map rendering.

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "trip_id": "12345_A..N",
      "route_id": "A",
      "lat": 40.72,
      "lon": -73.99,
      "timestamp": 1739628000,
      "stop_name": "Canal St (A27N)",
      "current_status": "IN_TRANSIT_TO",
      "direction": "N",
      "destination": "Inwood-207 St"
    }
  ]
}
```

### GET `/api/vehicles/insights`
Returns trend analytics for a selected route/time window, including comparison data.

Query params:
- `route`: route id or `ALL` (default `ALL`)
- `range`: `15m` | `1h` | `6h` | `24h` (default `1h`)
- `compare`: `none` | `previous` (default `previous`)

Example:
`GET /api/vehicles/insights?route=ALL&range=1h&compare=previous`

**Response 200**
```json
{
  "success": true,
  "data": {
    "range": "1h",
    "compare": "previous",
    "route": "ALL",
    "series": [
      { "ts": 1739700000000, "count": 241 },
      { "ts": 1739700010000, "count": 246 }
    ],
    "current_avg": 244,
    "previous_avg": 232,
    "delta": 12,
    "delta_percent": 5,
    "top_routes": [
      { "route_id": "A", "vehicle_count": 24 },
      { "route_id": "C", "vehicle_count": 20 }
    ]
  }
}
```

---

## 3) Authentication

### POST `/api/auth/register`
Create a new account.

**Request**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response 200**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### POST `/api/auth/login`
Login with email/password.

**Request**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response 200**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### GET `/api/auth/me` (Protected)
Get current authenticated user.

**Headers**
```http
Authorization: Bearer <JWT>
```

**Response 200**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

---

## 4) Favorites (Protected)

### GET `/api/favorites`
Get current user's favorite routes and stops.

**Response 200**
```json
{
  "success": true,
  "data": {
    "routes": [
      { "route_id": "A" }
    ],
    "stops": [
      { "stop_id": "A27N", "stop_name": "Canal St (A27N)" }
    ]
  }
}
```

### POST `/api/favorites/routes`
Add favorite route.

**Request**
```json
{
  "route_id": "A"
}
```

### DELETE `/api/favorites/routes/:routeId`
Remove favorite route.

### POST `/api/favorites/stops`
Add favorite stop.

**Request**
```json
{
  "stop_id": "A27N",
  "stop_name": "Canal St (A27N)"
}
```

### DELETE `/api/favorites/stops/:stopId`
Remove favorite stop.

---

## 5) Alerts

### GET `/api/alerts`
Get recent service alerts (public endpoint).

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert_id",
      "header_text": "Service Change",
      "description_text": "Downtown trains skip selected stations",
      "effect_text": "Planned Work",
      "route_ids": ["A", "C", "E"],
      "stop_ids": ["A27N"]
    }
  ]
}
```

### GET `/api/alerts/notifications/me` (Protected)
Get alerts related to current user's favorites.

---

## 6) Notification Center (Protected)

### GET `/api/notifications?unread=1`
Get notification center items.  
`unread=1` is optional.

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "title": "Service Alert: A Line",
      "body": "Details...",
      "effect_text": "Planned Work",
      "is_read": false,
      "email_sent": true,
      "created_at": "2026-02-15T10:00:00.000Z"
    }
  ]
}
```

### PATCH `/api/notifications/:id/read`
Mark single notification as read.

### PATCH `/api/notifications/read-all`
Mark all notifications as read.

### GET `/api/notifications/settings`
Get notification settings for current user.

**Response 200**
```json
{
  "success": true,
  "data": {
    "email_notifications_enabled": true
  }
}
```

### PATCH `/api/notifications/settings`
Update notification settings.

**Request**
```json
{
  "email_notifications_enabled": false
}
```

---

## 7) Error Response Convention

Typical error response:

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

Common status codes:
- `200` success
- `400` validation/business error
- `401` unauthorized
- `404` resource not found
- `500` internal server error

---

## 8) Auth Flow Summary

1. Call `/api/auth/login` or `/api/auth/register` to receive JWT.
2. Store JWT in frontend local storage (`transit_auth_token`).
3. Send JWT via `Authorization` header for protected routes.
4. Backend middleware validates JWT and injects user context.

