# InviteIdeas

InviteIdeas is a digital invitation marketplace and editor with one-time payment per invitation. It includes a responsive Next.js storefront, a NestJS API, a MySQL schema, customer accounts and an admin console.

## Local setup

Use Node.js 24, npm, and MySQL 8.4. The included Compose file can provision a local database.

```sh
npm ci
docker compose up -d
```

Copy `.env.example` to `.env` at the repository root. Keep `DATABASE_URL` consistent with the MySQL user and database. Generate a secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` and set `JWT_SECRET`. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 16 characters to provision the admin account. Omit both to skip admin provisioning.

```sh
npm run db:deploy
npm run generate -w api
npm run db:seed
npm run dev
```

Open http://localhost:3000. Use `/admin` after signing in with the seeded account. The API listens on 127.0.0.1:4000. The storefront can render its bundled catalog during API outages. Creating or changing a draft requires the API and database.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL connection URL. URL-encode special characters in credentials. |
| `APP_ORIGIN` | Browser-visible origin without a trailing slash. Use HTTPS in production. |
| `JWT_SECRET` | Random JWT signing secret with at least 32 characters. |
| `API_PORT`, `API_ORIGIN` | Private port and origin, default to 4000 and http://127.0.0.1:4000. |
| `STORAGE_DIR` | Writable private directory for optimized images and generated QR files. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional bootstrap credentials used by the seed script. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth web application credentials. |
| `SMTP_URL`, `MAIL_FROM` | SMTP transport URL and verified sender. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay credentials. Start with test mode. |
| `RAZORPAY_WEBHOOK_SECRET` | Separate secret configured for the Razorpay webhook. |
| `SUPPORT_EMAIL` | Address linked from the contact page. |

### Integrations

- Register `${APP_ORIGIN}/api/auth/google/callback` as a Google OAuth redirect URI. A Google-verified address links to an existing customer account when the email matches.
- Configure an authenticated SMTP sender to enable verification, recovery and customer activation messages. Registration asks the customer to confirm their password after opening the verification email. Configure SPF, DKIM and DMARC for the sender.
- Enable automatic capture in Razorpay and register `${APP_ORIGIN}/api/payments/webhook` for `payment.captured` and `payment_link.paid`. The backend verifies signatures, retrieves payment details and requires matching captured funds before publication. Try both checkout and payment links using Razorpay test credentials before accepting payments. Offline activation is limited to admins and records the operator, method and reference.
- Set a private absolute `STORAGE_DIR` on the server. The NestJS API serves optimized gallery images according to invitation visibility. The admin music library accepts licensed HTTPS audio sources.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Schema migrations are in `apps/api/prisma/migrations`. Add future migrations with the Prisma CLI from `apps/api`, using a development database. Deploy committed migrations with `npm run db:deploy`.

With the web and API servers running against a disposable seeded database, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the shell and run `node apps/api/test/smoke.mjs`. It writes test accounts, invitations, photos, payment records and blog entries. Set `DATABASE_URL` to the same disposable database and build the API first to exercise coupon limit races, gateway capture responses, exact-time locking and archiving.

## Hostinger deployment

1. Provision the Hostinger server with Node.js 24, MySQL 8.4, Nginx, PM2 and Certbot. Use a dedicated MySQL user and a dedicated application user.
2. Clone the repository and configure the root `.env`. Set an HTTPS `APP_ORIGIN`, an absolute `STORAGE_DIR`, integration credentials and a support email. Set `API_ORIGIN` only if the API listens on a different local origin.
3. Run `npm ci`, `npm run db:deploy`, `npm run build` and `npm run db:seed`. Remove the bootstrap password from the environment after provisioning.
4. Run `pm2 start deploy/ecosystem.config.cjs --update-env`, save the process list and set up PM2 startup. Use the supplied Nginx configuration as a starting point and replace the example domain.
5. Validate and reload Nginx, then request TLS with `certbot --nginx -d your-domain.example`. Verify HTTPS, payment webhooks and account email delivery. Keep ports 3000, 4000 and 3306 private.
6. Back up the database and storage directory on a schedule. Use `mysqldump --single-transaction` and an encrypted copy of media to separate storage. Test a restore into a separate database and storage location.

## Operational notes

- A missing catalog usually means the database migration or seed has not run. Inspect API startup logs and verify the migration status.
- Preview links require the owner or an admin to sign in. A public URL and QR become available after activation. Editing closes at the start time of the last event. The editor currently accepts times in IST.
- Active customers retain the saved template version and order price snapshot. Changes to a catalog version apply to new drafts.
- Coupon limits include open Razorpay orders because those orders can still be paid. The saved order includes the original prices, coupon, discount and final amount.
- Payment verification may arrive after the browser returns. Check the dashboard and Razorpay webhook delivery history before attempting any manual resolution.
- This implementation covers the core buying and admin-assisted flows. The admin console includes editable homepage copy, FAQ, contact details, SEO, blog posts and sales reports and coupon management. The brief also calls for refund operations, configurable taxes, formal policy pages, more granular roles, a visual template builder, expanded analytics and notifications, additional templates and broader storefront localization. Those items require further implementation. Public invitation labels are available in English, Bengali and Hindi. The supplied example policy copy requires business review before launch.

## Wedding collection

The collection is defined in `wedding-collection.json`. Each design declares its saved template layout, sample ceremony schedule, guest-facing sections, and optional editor fields. Run `npm run db:deploy`, `npm run generate -w api`, and `npm run db:seed` to add the collection to an existing database. The seed adds missing entries and preserves administrator edits to existing templates.
## Uploaded template batch 01

The five React designs and scoped styles live in `apps/web/templates`. The versioned `config.componentKey` selects a lazy-loaded component through `apps/web/templates/index.ts`; `adapter.ts` translates existing invitation data to the uploaded components. `template-batch-01.json` seeds published records, converting the supplied INR prices to paise. No customer content is stored in template source.

- `GET /api/templates` lists published designs. `PATCH /api/admin/templates/:slug` updates availability, display metadata and pricing. `POST /api/admin/templates/:slug/versions` publishes a versioned configuration.
- `POST /api/invitations/drafts` starts an authenticated draft with a template and request ID. `GET /api/invitations/:id` and `PATCH /api/invitations/:id` load and save editor data. Checkout requires a complete schedule.
- `GET /api/preview/:token` returns an authenticated preview. `GET /api/public/invite/:slug` returns a published invitation and its pinned template ID and version. `/invite/[slug]` uses the same renderer as the editor and previews.
- The existing checkout, payment webhook, RSVP, gallery and QR endpoints are reused. Run migrations and seed before testing the new designs.
