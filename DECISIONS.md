# Product decisions (locked)

## 1. App publishing model → **C Hybrid later**

Ship a **shared multi-tenant** Expo app now. Keep tenant identity clean so separate branded EAS builds can be added later without a rewrite.

| Now | Later (optional per company) |
|-----|------------------------------|
| One App Store / Play listing | EAS profile per company |
| Runtime branding (logo, colors, welcome) | Own bundle ID, icon, splash |
| `company_id` / white-label config = tenant | `EXPO_PUBLIC_TENANT_ID=<company_uuid>` in that build |

**Tenant resolution order (mobile):**

1. `EXPO_PUBLIC_TENANT_ID` (branded build) → load that company’s white-label config  
2. Else default white-label owner (shared marketplace)  
3. `marketplace_mode_enabled` controls whether other sellers appear  

Do **not** assume every buyer needs a separately published app until they pay for that ops path.

---

## 2. Delivery fees → **C Defer fees**

Checkout still offers **Pickup** vs **Delivery** (address required for delivery).

| Rule | Behavior |
|------|----------|
| Delivery fee charged | Always **$0** while deferred |
| Config flag | `DELIVERY_FEES_ENABLED=false` (backend `.env` / Railway) |
| Schema | `delivery_fee` / `delivery_fee_flat` columns kept for later |
| Courier | Not selected — do not invent rates |

To turn fees on later: set `DELIVERY_FEES_ENABLED=true` and configure per-company `delivery_fee_flat` (or distance tiers when approved).

---

## Related (still deferred)

- Rock / Paper / Scissors gamification — not approved  
- Paid courier provider — not selected  
- Separate branded store listings — only after hybrid tenant path is used  
