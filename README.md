# Nexzoneo — White-Label Local Marketplace Platform

A full-stack MVP marketplace built from the Nexzoneo technical and functional specifications.

## Stack

| Part | Technology | Language |
|------|------------|----------|
| Mobile app | React Native (Expo) | TypeScript |
| Backend/API | FastAPI | Python |
| Database | PostgreSQL | SQL |
| Seller dashboard | React (Vite) | TypeScript |

## Project Structure

```
├── backend/          # FastAPI REST API
├── dashboard/        # Seller web dashboard
├── mobile/           # Customer React Native app
└── docker-compose.yml
```

## Features (MVP)

### Customer Mobile App
- Splash / Login & registration
- Home with nearby product browsing
- Search results with ranking
- Product & seller detail pages
- Cart & checkout
- Order status tracking & simulated payment
- Product & seller ratings

### Seller Dashboard
- Overview with stats and clickable recent orders
- Product management (CRUD) with validation
- Order management (accept/reject/fulfill) + dedicated order detail page
- White-label branding settings
- Profile & company settings, change password
- Empty states, skeleton loaders, new-order notifications

### Customer Mobile App (continued)
- Empty states on Home, Search, Cart, and Orders
- Live search (debounced as you type)
- Mixed-seller cart warning (blocks checkout)
- Profile: name, phone, saved address, change password
- Skeleton loaders while data loads
- **Premium:** persisted cart, delivery/pickup checkout, white-label logo & colors, pull-to-refresh, error retry states, local order notifications, rate all products in an order

### Backend API
- JWT authentication with role-based access
- Product search with location-based ranking
- Order flow: Pending → Seller Accepted → Awaiting Payment → Paid → Completed
- White-label config & ranking boost
- File upload support
- Demo seed data

## Color Theme

- Deep Navy: `#141B4D`
- Soft Royal Blue: `#53619A`
- Muted Blue: `#7890B0`
- Warm Beige: `#E9DFCC`

## Quick Start

### 1. Database

**Option A — PostgreSQL (recommended for production)**

```bash
docker compose up -d
```

Set `DATABASE_URL=postgresql://nexzoneo:nexzoneo@localhost:5432/nexzoneo` in `backend/.env` and install `psycopg2-binary`.

**Option B — SQLite (local dev, no Docker)**

The default `.env` uses `sqlite:///./nexzoneo.db` — works out of the box.

### 2. Backend API

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 3. Seller Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:5173

### 4. Mobile App

```bash
cd mobile
npm install
npx expo start
```

For physical devices, set `EXPO_PUBLIC_API_URL` to your machine's LAN IP (e.g. `http://192.168.1.10:8000`).

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@demo.com | demo123 |
| Seller (Nexzoneo) | seller@nexzoneo.com | demo123 |
| Seller (Local Fresh) | seller@localfresh.com | demo123 |

## API Endpoints

| Area | Endpoint | Method |
|------|----------|--------|
| Auth | `/auth/register`, `/auth/login`, `/auth/me`, `/auth/me` (PUT), `/auth/password` (PUT) | POST/GET/PUT |
| Products | `/products`, `/products/{id}` | GET |
| Companies | `/companies`, `/companies/{id}` | GET |
| Orders | `/orders`, `/orders/my`, `/orders/{id}/pay`, `/orders/{id}/checkout`, `/orders/{id}/payment-config` | POST/GET |
| Webhooks | `/webhooks/stripe` | POST |
| Seller | `/seller/products`, `/seller/orders`, `/seller/orders/{id}`, `/seller/company` | CRUD/GET/PUT |
| Ratings | `/ratings/product`, `/ratings/seller` | POST |
| White-label | `/white-label/config` | GET |
| Files | `/files/upload` | POST |

## Order Flow

1. Customer places order → **Pending**
2. Seller accepts → **Awaiting Payment**
3. Customer pays (simulated) → **Paid**
4. Seller fulfills → **Completed**
5. Customer rates product & seller

Payment happens **after** seller acceptance, per spec.

## Stripe Payments (optional)

When Stripe keys are set in `backend/.env`, customers pay with a real card via Stripe Checkout. Without keys, the app uses demo/simulated payment.

```bash
# backend/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYMENT_RETURN_URL=nexzoneo://payment
```

1. Create a [Stripe account](https://dashboard.stripe.com) and copy test keys.
2. Forward webhooks locally: `stripe listen --forward-to localhost:8000/webhooks/stripe`
3. Paste the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
4. On mobile, when an order is **Awaiting Payment**, tap **Pay with Card** — opens Stripe Checkout in the browser.
5. After payment, return to the app; order status updates via webhook (polls every 5s).

**Push notifications:** When a seller accepts an order, the customer receives a server push (Expo) if they registered a push token on login (physical device required).

## License

Proprietary — Nexzoneo Platform
