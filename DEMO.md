# Nexzoneo — One-click public demo

Customers open **one link** in the browser. No Expo Go, no install.

## What they do

1. Open your Netlify demo URL  
2. Tap **Try as customer** (or **Try demo instantly**)  
3. Browse products → cart → place order  

Seller path: **Try as seller** → dashboard login `seller@nexzoneo.com` / `demo123`

---

## Free hosting setup (once)

### 1. Backend API — Render (required)

1. Go to [render.com](https://render.com) → New → **Blueprint**
2. Connect `TanVinje/nexzoneo-application`
3. Apply `render.yaml` (creates API + free Postgres)
4. Wait for deploy → copy the API URL, e.g. `https://nexzoneo-api.onrender.com`
5. Open `/health` — should return `{ "status": "ok", ... }`

> Free Render services sleep after idle time. First request after sleep can take ~30–60s.

### 2. Demo hub + customer app — Netlify

1. [app.netlify.com](https://app.netlify.com) → Add new site → Import from Git  
2. Repo: `TanVinje/nexzoneo-application`  
3. Netlify reads root `netlify.toml` (builds Expo web into `/app` + landing page)  
4. Environment variables:

| Name | Value |
|------|--------|
| `EXPO_PUBLIC_API_URL` | `https://YOUR-API.onrender.com` |
| `EXPO_PUBLIC_SELLER_URL` | seller Netlify URL (step 3) |

5. Deploy → your **shareable customer link** is this site URL

Direct auto-login link:

`https://YOUR-DEMO.netlify.app/app/?demo=1`

### 3. Seller dashboard — Netlify (second site)

1. New Netlify site → same repo  
2. Base directory: `dashboard` (uses `dashboard/netlify.toml`)  
3. Env: `VITE_API_URL` = same Render API URL  
4. Deploy → update `EXPO_PUBLIC_SELLER_URL` on the hub site

---

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | `customer@demo.com` | `demo123` |
| Seller | `seller@nexzoneo.com` | `demo123` |

---

## Local preview

```bash
# API
cd backend && source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Customer web
cd mobile
EXPO_PUBLIC_API_URL=http://localhost:8000 npm run web

# Or production-like static build
EXPO_PUBLIC_API_URL=http://localhost:8000 npm run build:web
npx serve dist
```

---

## What to send a prospect

> Try Nexzoneo here (no install):  
> **https://YOUR-DEMO.netlify.app**  
>  
> Customer: click **Try as customer**  
> Seller: click **Try as seller** (`seller@nexzoneo.com` / `demo123`)
