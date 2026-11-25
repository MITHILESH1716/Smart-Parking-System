# SmartPark – Intelligent Parking System

Java (Spring Boot 3) + PostgreSQL backend, React (Vite) frontend.

## Features
**Driver:** register / login · browse lots · BookMyShow-style slot map · book ahead (date, arrival hour, duration) ·
"suggest best spot" (nearest to the entrance, per section: car, electric car, bike, electric bike, accessible zone) · hourly pricing · demo payment (UPI/card) ·
My bookings (pay later, cancel).

**Admin (separate login):** dashboard (revenue, occupancy, today's bookings) · create / edit / delete lots ·
**grid designer** (car bays are 2x1 - horizontal or vertical, your choice; electric and normal cars and bikes; separate accessible zone; rotate, block, road cells; resize; rename slots) ·
**book a slot for any registered user (by email) or walk-in customer** · all bookings with search, mark paid, check-out, cancel.

Pricing = lot base rate × slot-type multiplier (car ×1, electric car ×1.5, bike ×0.5, electric bike ×0.75, accessible ×1) × hours (every started hour is billed, min 1h).
Double-booking is prevented with a row lock + overlap check on the server.

## Run it
Backend prerequisite: install JDK 25 (LTS) and Maven 3.9 or newer.

1. Create the database:  `CREATE DATABASE smartparking;`
2. Edit `backend/src/main/resources/application.properties` (DB username / password, JWT secret).
3. Backend:  `cd backend && mvn spring-boot:run`   → http://localhost:8080
4. Frontend: `cd frontend && npm install && npm run dev` → http://localhost:5173

Seeded accounts (created on first start):
| Role | Email | Password | Login page |
|---|---|---|---|
| Admin | admin@smartpark.com | Admin@123 | /admin/login |
| Driver | user@smartpark.com | User@123 | /login |

A demo lot "Central Mall Parking" (6×10 grid) is also created. Change the admin password before deploying.

## API (JWT bearer token)
- `POST /api/auth/register`, `/api/auth/login`, `/api/auth/admin/login`
- `GET /api/lots`, `/api/lots/{id}/availability?start=&end=`, `/api/lots/{id}/suggest?start=&end=&type=`
- `POST /api/bookings`, `GET /api/bookings/my`, `POST /api/bookings/{id}/pay`, `DELETE /api/bookings/{id}`
- Admin: `GET /api/admin/stats`, `POST|PUT|DELETE /api/admin/lots`, `PUT /api/admin/lots/{id}/layout`,
  `GET|POST /api/admin/bookings`, `POST /api/admin/bookings/{id}/complete`

## Next steps (from your plan)
Gmail email verification, Google sign-in, real payment gateway (Razorpay), number-plate recognition (Python service).
