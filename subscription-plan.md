# Premium Subscription – Plan (Finalize Before Implementation)

## 1. Subscription table

**Table name:** `subscriptions`

| Column               | Type                         | Description |
|----------------------|------------------------------|-------------|
| `id`                 | serial, PK                   | Primary key |
| `user_id`            | integer, FK → users.id       | Subscriber (one active subscription per user) |
| `plan`               | text or enum                 | e.g. `premium_monthly` (later: `premium_yearly`) |
| `status`             | enum                         | `active` \| `cancelled` \| `expired` \| `pending_payment` |
| `started_at`         | timestamp                    | When subscription became active |
| `expires_at`         | timestamp                    | End of current billing period |
| `cancelled_at`       | timestamp, nullable          | When user requested cancel |
| `cancel_at_period_end`| boolean, default true         | If true: access until `expires_at`; if false: end immediately |
| `payment_provider`   | text, nullable               | e.g. `khalti`, `stripe` |
| `payment_reference`   | text, nullable               | External transaction / invoice ID |
| `amount_paid`        | decimal, nullable            | Amount stored for records (e.g. 1999) |
| `created_at`         | timestamp                    | Row creation |
| `updated_at`         | timestamp                    | Last update |

**Constraints / indexes:** Unique index on `(user_id)` where `status = 'active'` (or allow only one active per user in logic). Optional: index on `expires_at` for cron/jobs.

---

## 2. What’s included in Premium (product)

- **Expert verification** – After AI disease detection, get a second opinion from a real expert.
- **Priority support** – Faster response on support queries.
- **Higher scan limits** – More disease detection scans per month (e.g. unlimited or N/month).
- **Chat with experts** – Direct chat with verified experts (when that feature exists).
- **Everything in Basic** – Crop advisory, weather, market prices, government schemes, basic disease detection.

*(You can add/remove items here; this list matches current marketing copy.)*

---

## 3. Email on activation

- **When:** Right after a subscription is marked `active` (e.g. after successful payment callback or admin activate).
- **Content:** Welcome to Premium: plan name, start date, expiry date, what they get, link to dashboard / help, “cancel anytime” note.
- **Implementation:** Reuse existing nodemailer setup; add something like `sendSubscriptionActivatedEmail(email, userName, plan, expiresAt)` in `server/src/config/email.js`, call it from subscription service after setting status to `active`.

---

## 4. Cancel subscription

- **User action:** “Cancel subscription” in app (e.g. Premium page or User Dashboard / Account).
- **Behaviour (choose one and stick to it):**
  - **Option A – Cancel at period end (recommended):** Set `cancelled_at = now`, `cancel_at_period_end = true`. User keeps access until `expires_at`; no refund. No renewal after that.
  - **Option B – Cancel immediately:** Set status to `cancelled`, `expires_at = now` (or keep `expires_at`, but treat as no access). Access stops right away.
- **Optional:** Send a “Subscription cancelled” email (effective date, access until when if Option A).

---

## 5. User flows (high level)

1. **Subscribe**
   - User on `/premium` → chooses payment (Khalti / Stripe) → proceeds.
   - Backend: create subscription row `pending_payment` → redirect to payment.
   - Payment success webhook/callback → set status `active`, set `started_at`, `expires_at`, payment fields → **send activation email**.
2. **Use Premium**
   - Any protected Premium feature checks “does this user have an active subscription?” (e.g. `expires_at > now` and status `active`).
3. **Cancel**
   - User clicks “Cancel subscription” → API sets `cancelled_at` and (if Option A) `cancel_at_period_end = true`; no renewal after `expires_at`. Optional cancellation email.

---

## 6. API endpoints (to implement)

| Method | Path                         | Auth   | Description |
|--------|------------------------------|--------|-------------|
| GET    | `/api/subscription`          | User   | Get current user’s subscription (active or last). |
| POST   | `/api/subscription`          | User   | Create subscription (e.g. after payment; or create `pending_payment` and return payment URL/details). |
| POST   | `/api/subscription/cancel`   | User   | Cancel subscription (at period end or immediately per plan). |
| POST   | `/api/subscription/webhook`  | No auth (verify by signature) | Payment provider callback to set `active` and send email. |

*(Exact paths and payloads can be adjusted when we implement.)*

---

## 7. Frontend (to implement)

- **Premium page (`/premium`):** If logged in and already active → show “You’re Premium until …” and “Cancel subscription”. If not Premium → show plan, price, payment choice and “Proceed to payment” (later wired to real payment).
- **Dashboard / profile:** Show Premium status and “Manage subscription” / “Cancel subscription” if active.
- **Feature gating:** Where Premium is required (e.g. expert verification, higher scan limit), check subscription via GET `/api/subscription` or a “isPremium” flag from backend.

---

## 8. Out of scope for now (optional later)

- Actual Khalti / Stripe integration (can mock “activate” for testing).
- Renewals / recurring billing (manual or cron later).
- Multiple plans (e.g. yearly); table already supports `plan`.
- Refunds (handled outside app or manually).
- Admin list of subscribers (simple admin view later).

---

## 9. Summary checklist (finalize these)

- [ ] Table: confirm columns and add/remove anything (e.g. `currency`, `billing_interval`).
- [ ] Product: confirm list of “What’s included in Premium” (section 2).
- [ ] Cancel: choose Option A (at period end) or Option B (immediate).
- [ ] Emails: activation only, or activation + cancellation?
- [ ] API: paths and auth (user-only vs webhook public with signature).
- [ ] Payment: for first phase, OK to “mock” activation (e.g. admin or a test button) and wire real payment later.

Once you finalize the plan (and tell me any changes), we can start implementing.
