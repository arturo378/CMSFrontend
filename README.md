# Chemical Management System

A React application for managing chemical inventory, field deliveries, warehouse transfers, and operational reporting across multiple clients.

The application supports both a standalone demonstration with sample data and an authenticated deployment connected to a REST API.

## Features

- **Operations dashboard:** Delivery metrics, revenue trends, chemical usage, inventory levels, recent activity, and a map of well locations.
- **Work orders:** Delivery tracking, shipping papers, chemical quantities, completion status, and location details.
- **Inventory and pricing:** Warehouses, chemical products, stock records, and company-specific prices.
- **Location management:** Companies, leases, and wells with GPS coordinates.
- **Reporting:** Earnings and user activity reports with date filters, warehouse inventory reports, and Excel exports.
- **Administration:** User management, role-based access, and platform superadmin controls for managing and switching clients.

## Getting started

### Requirements

- Node.js 23 or later, as specified in `package.json`.
- npm.

From the repository root:

```sh
npm ci
npm start
```

Open [localhost:3000](http://localhost:3000). The repository enables **demo mode** by default, so a backend and login credentials are not required.

## Demo mode

The demo opens as **Demo Superuser** with the application's highest permission level, `superadmin`. Two fictional clients—Permian Chemical Services and Eagle Ford Chemical Services—have separate users, companies, leases, wells, warehouses, products, prices, and work orders.

All API operations run locally in the browser. You can create and edit records, manage chemicals, switch clients, and generate reports using the same screens as a connected deployment. Changes persist in browser storage, separately from real account credentials and client selections. Password-reset actions are simulated and send no email.

To explore the application:

1. Select a company on the dashboard to populate the revenue and chemical charts.
2. Open a delivery or shipping paper to view its location and manage its chemicals.
3. Choose a company, warehouse, or user in the reports to review and export the corresponding data.
4. Use the client selector in the header to explore the second client's records.

Select **Reset demo data** to restore the sample records, refresh their dates, clear the selected client, and return to the dashboard. The demo superuser and home client remain active to preserve access. After signing out, select **Enter demo** to return.

Map tiles and the icon font use public internet services, even in demo mode.

## Local mobile app showcase

With dependencies installed in `CMSFrontend`, run:

```sh
npm run demo
```

- Open [the embedded mobile showcase](http://localhost:3000/mobile-demo).
- Open [the hosted field app](https://cms-mobile-app.vercel.app/dashboard).
- Press Ctrl+C in the launcher terminal to stop the frontend.

The launcher enables frontend demo mode and embeds the hosted mobile app at
`https://cms-mobile-app.vercel.app/dashboard`. Only port 3000 is needed; a local
copy of CMSMobileApp is not required. The iframe and standalone link both use
`REACT_APP_MOBILE_DEMO_URL`, which can override the default hosted URL. Restart
the development server after changing this setting.

To develop the mobile app locally too, place `CMSMobileApp` beside `CMSFrontend`,
install dependencies in both, and run `npm run demo:local`. This starts both
servers and embeds `http://localhost:5173` instead of the hosted app.

In the sidebar, select **Mobile App Demo**. Create a shipping paper with different
origin and destination warehouses, enter a truck number, and add a chemical
quantity (for example, 100 gallons). Record a field delivery (for example, 25
gallons), then close the shipment to return the remaining stock. The CMS shipping
and delivery tables show the records created in the embedded app. GPS uses a
sample Midland location without requesting access to the visitor's location.

The iframe exchanges requests with this page through an origin- and
window-checked demo bridge. The bridge uses the same browser-only demo API as
the CMS, scopes requests to the selected client, and refreshes affected query
caches. Resetting the shared demo starts a new mobile session, and switching
clients keeps each client's in-progress shipment separate. **Reset demo** inside
the embedded phone resets the shared CMS sample data too.

The standalone field app has its own sample data. Its changes do not synchronize
with CMSFrontend; use the embedded showcase to demonstrate the connected flow.

Build CMSFrontend with `REACT_APP_DEMO_MODE=true` to publish the showcase. The
hosted mobile app is the default iframe URL in both development and production;
set `REACT_APP_MOBILE_DEMO_URL` to use a different deployment. The mobile app must
be built with `npm run build:demo` for the shared demo bridge to work. Both hosts
need SPA fallback routing. Allow the frontend origin to
embed the mobile host if you configure framing restrictions. The CMS demo bridge
requires no API server even when the two apps use different origins.

## Connecting a backend

Create a `.env.local` file in the repository root:

```dotenv
REACT_APP_DEMO_MODE=false
REACT_APP_API_URL=http://localhost:3001
```

Start the backend separately, then restart the frontend. Sign in with an account provided by that backend.

The API client sends Bearer access tokens and includes cookies for session refresh. For deployments with separate frontend and API origins, the backend must allow the frontend origin and credentialed requests.

Backend-connected deployments use the `user`, `admin`, and `superadmin` roles. The backend enforces authorization; frontend route and navigation controls reflect those permissions.

## Configuration

| Variable | Repository default | Purpose |
| --- | --- | --- |
| `REACT_APP_DEMO_MODE` | `true` | Runs API operations locally and grants demo superadmin access. Set to `false` for backend authentication. |
| `REACT_APP_API_URL` | `http://localhost:3001` | REST API base URL, used when demo mode is disabled. |
| `REACT_APP_MOBILE_DEMO_URL` | `https://cms-mobile-app.vercel.app/dashboard` | Hosted mobile app used by the phone preview and standalone link. |
| `PUBLIC_URL` | `.` | Base path for generated static assets. |
| `GENERATE_SOURCEMAP` | `false` | Controls source map generation for production builds. |

Use `.env.local` for local overrides; it is excluded from version control. Configuration is read when the development server starts or the production bundle is built. Restart or rebuild after changing it.

The tracked `.env` contains public frontend defaults only. Do not add passwords,
private keys, or backend secrets: `REACT_APP_*` settings are included in the
browser bundle. Keep machine-specific settings in ignored `.env.local`, and
configure deployment-specific values through your hosting service.

## Development

| Command | Purpose |
| --- | --- |
| `npm start` | Starts the development server with automatic reload. |
| `npm run demo` | Starts the CMS demo with the hosted mobile app embedded. |
| `npm run demo:local` | Starts both CMSFrontend and the sibling CMSMobileApp locally. |
| `npm test` | Runs tests in interactive watch mode. |
| `npm test -- --watchAll=false --runInBand` | Runs the test suite once. |
| `npm run build` | Creates the production bundle in `build/`. |

The test suite covers demo authentication, permission checks, populated screens, report filters, local data operations, client isolation, and backend request behavior.

### Technology

React 16 and React Router 5 provide the application shell. Material-UI 4 and material-table provide interface components; Redux Toolkit and RTK Query manage shared state and API data. Charts use Recharts, maps use Leaflet, and spreadsheet exports use ExcelJS.

### Source layout

```text
src/
  Admin/         User, client, location, product, warehouse, and pricing management
  Dashboard/     Metrics, charts, filters, maps, and recent activity
  Reports/       Earnings, inventory, and user activity reports
  WorkOrders/    Deliveries, shipping papers, and chemical details
  components/    Shared navigation, route guards, and interface components
  config/        API client, authentication, permissions, and demo configuration
  demo/          Sample data, local API implementation, and demo tests
  store/         Redux slices and RTK Query endpoints
```

### Dependency compatibility

Installation, startup, and production builds run [scripts/patch-material-table.js](scripts/patch-material-table.js). The script fixes the `defaultExpanded` prop-type validator in material-table 1.63.0 and clears affected Webpack caches when the patch is applied. Restart an existing development server after the patch is first applied.

## Deployment

Build with the configuration intended for the target environment, then publish the contents of `build/` to a static host. For hosting at the domain root, set `PUBLIC_URL=/` before building. Configure the host to serve `index.html` for application routes so direct links and page refreshes work.

A demo build runs without an API server and always grants local superadmin access. For an authenticated deployment, set `REACT_APP_DEMO_MODE=false` and configure `REACT_APP_API_URL` before building.
