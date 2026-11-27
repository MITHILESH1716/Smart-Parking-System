# SmartPark - Intelligent Parking System

Java 23 / Spring Boot 3 + PostgreSQL backend, React / Vite frontend.

## Features
- Multiple floors per parking lot, with an independent admin-designed grid on each floor.
- Driver booking across all bay types: standard car, electric car, bike, electric bike, accessible, and elderly-friendly bays; choose a specific type or Any type.
- Availability and best-spot suggestions are scoped to the selected floor and time. Server-side row locking and overlap checks prevent double booking.
- Hourly pay-as-you-go bookings use the lot rate multiplied by bay type and started hours.
- Gold weekly, Platinum monthly, and Diamond yearly subscriptions. Admin sets each plan price. An active subscription includes unlimited individual reservations during its term; every visit still requires an available spot and selected time. Covered reservations show ₹0 and Paid. No permanent spot is assigned.
- Existing user accounts, admin console, demo payment flow, booking cancellation/check-out, and seeded example lot.
- Optional local number-plate reading from a vehicle photo in the booking form. Recognition runs on the user's computer and fills the editable vehicle-number field for review.

## Default bay dimensions
The driver booking summary shows bay width, length, and footprint area before confirmation. Default shared car bays (including EV and elderly-priority bays) display 2.75 m x 5.00 m, based on BIS SP 73:2023 Table 25. Two-wheeler bays use the BIS 1.25 m² minimum area, rendered as a 1.25 m x 1.00 m footprint for display. Accessible car bays display 3.60 m x 5.00 m including the 1.20 m side transfer zone, based on MoHUA's Harmonised Guidelines for Universal Accessibility in India. Footprints exclude aisles and maneuvering space; local approvals may specify different dimensions. Sources: [BIS SP 73:2023, Table 25](https://www.bis.gov.in/wp-content/uploads/2024/02/20240115-Karnataka-Final-Standardized-Development-and-Building-Regulations.pdf) and [MoHUA Harmonised Guidelines 2021, section 3.4](https://divyangjan.depwd.gov.in/upload/uploadfiles/2262.pdf).

## Prerequisites
- JDK 23 (the Maven compiler is configured for Java 23)
- Maven 3.9+
- Node.js 20+ and npm
- PostgreSQL 15+
- Python 3.11 (for local number-plate recognition)

## First-time setup
1. Create a PostgreSQL database named `smartparking`. If you are upgrading the previous one-floor project and want to keep its data, connect to `smartparking`, stop the backend, and run `setup/migrate-existing-database.sql` first. It assigns existing lots and slots to floor 1 and preserves rows. For a clean demo instead, connect to `postgres` and run `setup/reset-database.sql`; **that reset script drops all existing SmartParking data.**
2. Set backend environment variables before starting the backend:
   - `DB_URL` (default `jdbc:postgresql://localhost:5432/smartparking`)
   - `DB_USERNAME` and `DB_PASSWORD`
   - `JWT_SECRET` (use a private random secret of at least 32 characters)
   - Optional `CORS_ORIGINS` (default `http://localhost:5173`)
   - Optional `GOOGLE_CLIENT_ID` if Google sign-in is configured
3. In PowerShell, set local backend values for this terminal session (use your own PostgreSQL password and a private random JWT secret):
   ```powershell
   $env:DB_USERNAME = "postgres"
   $env:DB_PASSWORD = "your_postgres_password"
   $env:JWT_SECRET = "replace_with_a_private_random_secret_at_least_32_chars"
   ```
4. Start the backend: `cd backend`, then `mvn spring-boot:run` (API at `http://localhost:8080`). Hibernate creates/updates the schema and seeds Gold, Platinum, Diamond, demo accounts, and a sample lot if missing.
5. In another terminal, start the frontend: `cd frontend`, run `npm install`, then `npm run dev` (site at `http://localhost:5173`). The Vite dev server proxies `/api` to port 8080. If using Google sign-in, copy `.env.example` to `.env.local` and set `VITE_GOOGLE_CLIENT_ID`; also set backend `GOOGLE_CLIENT_ID` to the matching OAuth client ID. The Vite proxy targets localhost:8080.
6. Optional local number-plate recognition: in another terminal, run `cd local-alpr`, create and activate a Python 3.11 virtual environment (`py -3.11 -m venv .venv`, then `.venv\\Scripts\\Activate.ps1` in PowerShell), install dependencies with `python -m pip install -r requirements.txt`, then start the service with `python -m uvicorn app:app --host 127.0.0.1 --port 8001`. The first recognition downloads and caches the detector/OCR model files; after that, inference runs locally. The service accepts JPG/PNG/WEBP images up to 8 MB, processes them in memory, and does not retain them. Upload a clear image, click **Read number plate**, review/correct the editable result, and then make the booking. If the model service is off, manual vehicle-number entry still works.

### Demo accounts
| Role | Email | Password | Page |
|---|---|---|---|
| Admin | admin@smartpark.com | Admin@123 | `/admin/login` |
| Driver | user@smartpark.com | User@123 | `/login` |

Change demo credentials before any shared deployment. Payments are simulated; no live payment gateway is configured.

## Quick feature run-through
1. Sign in as admin. Open Parking lots and create or edit a lot; set rows, columns, and floor count.
2. Open Design grid. Select each floor tab, add car/bike/EV/accessible/elderly bays, and save each layout.
3. Open Subscriptions in the admin navigation. Set the price for Gold, Platinum, and Diamond and save.
4. Sign in as a driver. Open Plans and use the demo payment confirmation to activate a tier.
5. Find parking. Select lot, floor, time range, and Any type or a specific bay type. Choose an available spot or use Suggest best spot. Confirm each visit separately. An active subscription covers the booking price for visits fully inside its active period.
6. Check My bookings to see floor, spot, time, amount, and payment state. The subscription page shows the current plan expiry.

## Data migration note
Use `setup/migrate-existing-database.sql` to upgrade an existing one-floor database without deleting data. Existing lots and slots are mapped to floor 1, and the old unique slot-position constraint is replaced with a floor-aware constraint. Stop the backend and back up the database before running any schema migration. Use `setup/reset-database.sql` only when you intend to erase demo data.

## API summary
- Auth: `POST /api/auth/register`, `/api/auth/login`, `/api/auth/admin/login`, `/api/auth/google`
- Lots: `GET /api/lots`, `GET /api/lots/{id}/availability?floor=1&start=&end=`, `GET /api/lots/{id}/suggest?floor=1&start=&end=&type=ANY`
- Bookings: `POST /api/bookings`, `GET /api/bookings/my`, `POST /api/bookings/{id}/pay`, `DELETE /api/bookings/{id}`
- Subscriptions: `GET /api/subscriptions/plans`, `GET /api/subscriptions/current`, `GET /api/subscriptions/history`, `POST /api/subscriptions/purchase`
- Admin: `/api/admin/stats`, lot and floor-layout endpoints, bookings, and `GET/PUT /api/admin/subscription-plans[/{code}]`

## Next steps
Gmail verification and a real payment integration remain future work.
