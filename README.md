# CW: Doorstep Car Wash (website + installable app)

A 3D showroom-style website for **CW**, a doorstep car wash and cleaning
service with monthly and yearly subscription plans. The same site installs on
phones as an app (PWA). Bookings reach the owner on WhatsApp with every detail
pre-filled, so there is no backend and no server cost.

## What the customer sees

| Section | What happens |
| --- | --- |
| Hero + wash story | A 3D car on a neon turntable. As you scroll, the car rotates and goes from **dusty → foam → water jets → shiny with sparkles** |
| Showroom | Pick **Hatchback / Sedan / SUV** (the 3D model changes) and a **paint colour** |
| Why us / How it works | Doorstep, water saving, trained staff, photo on WhatsApp |
| Plans | Monthly / yearly toggle, prices per car type, yearly savings shown automatically |
| Add-ons | Interior, wax, rubbing, engine bay, AC vent, ceramic |
| Booking | Name, phone, car, plan, add-ons, pincode check, address, **share current location**, start date, wash days, time slot → opens WhatsApp |
| App | Install button (Android/desktop), iPhone "Add to Home Screen" guide, logo splash screen, works offline |

## Admin panel: `/admin`

Open `https://<your-site>/admin` on phone or laptop and log in with your PIN.

| Tab | What you can do |
| --- | --- |
| Bookings | Every booking with call / WhatsApp / map buttons, status (New → Confirmed → Active → Paused / Cancelled), notes, delete, CSV export |
| Referrals | Rewards still to give (referred customer is Active, reward not marked), top referrers |
| Settings | Referral on/off, **new customer's discount %**, **referrer's reward %**, WhatsApp number, all plan prices, washes per month, add-on prices |

### One-time setup in Vercel

1. **Storage → Connect Database → Upstash for Redis** (free plan) and connect it to this project.
2. **Settings → Environment Variables**: add `ADMIN_PIN` (6+ digits, keep it secret).
   Optional: `REFERRAL_SECRET` (any long random text) so referral codes can't be guessed.
3. **Deployments → Redeploy**.

Without the database the site still works: bookings still go to WhatsApp,
prices come from `src/config.ts`, and the Refer & earn section stays hidden.

### How referral works

1. A customer gets a code (e.g. `CW7KQ2MX`) after booking, or from the **Refer & earn** section, and shares a link `/?ref=CODE`.
2. The friend's booking form fills the code in, shows the discount and sends it in the WhatsApp message.
3. In the admin, the booking shows who referred it. When the friend's plan is **Active**, give the referrer their reward and tick **Referrer reward given**.

Self-referral is blocked. Bookings, referral codes and admin login are rate-limited, and 10 wrong PINs lock that network out for 15 minutes.

## Editing content (no coding needed)

Everything is in **[`src/config.ts`](src/config.ts)**. Items still waiting for
real information are marked `// TODO`:

- `BRAND.whatsapp`: owner's WhatsApp number, digits with country code (`919876543210`)
- `PLANS[].prices`: price per car type for `monthly` and `yearly`. Leave `null` to show "Price on request"
- `PLANS[].washesPerMonth`: e.g. `"8 washes / month"`
- `ADDONS[].price`
- `SERVICE_PINCODES`, `SERVICE_AREAS`, `BRAND.city`, `BRAND.hours`
- FAQ answers about rain, pausing and water

Logo: `public/logo.svg`. After changing it, run `npm run icons` to regenerate
the app icons.

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build into dist/
```

## Deploy on Vercel

1. On vercel.com, click **Add New → Project** and import this GitHub repo.
2. Vercel detects Vite automatically (build `npm run build`, output `dist`). Click **Deploy**.
3. Every push to `main` redeploys.

## Tech

Vite · React 19 · TypeScript · Tailwind CSS 4 · Three.js via React Three Fiber
and drei · vite-plugin-pwa. The 3D car is built from code, without a
downloaded model, so there are no licence issues and the download stays small.
