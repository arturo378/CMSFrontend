# Platform UI modernization plan

Draft created November 12, 2026 on `UIChanges`, starting from `6374259`.

## Implementation status — November 12, 2026

The frontend implementation is available on `UIChanges`:

- Shared theme, responsive app shell, account menu, page headings, and route labels.
- Locations → leases → wells navigation with record IDs in URLs, verified parent lookups, breadcrumbs, and recovery for missing or mismatched parents. Existing route paths remain valid.
- Shared tables with search, sorting, pagination, density controls, and views saved per user, client, page, and parent context.
- Shared record forms across administration and operations, with field validation, searchable record selection, dependent selection resets, failed-save recovery, duplicate-submit guards, and unsaved-change protection.
- Named destructive-action confirmations, queued notifications, responsive map dialogs, and safe client switching that clears old context and returns to the relevant parent list.
- Shared report layouts, URL-based filters, inclusive local date ranges, correct totals, and pending/error feedback for Excel downloads. Authentication screens share the visual treatment and include password visibility controls.
- Deferred route, map, and Excel loading. The main production JavaScript bundle is approximately 160 kB compressed, compared with approximately 868 kB before the redesign; destination pages load additional code on demand.

Verification: 23 automated checks cover navigation, parent recovery, failed and duplicate saves, client switching, phone drawer/full-screen form behavior, report totals/export state, role restrictions, pagination completeness, date boundaries, and the original table warning. The production build passes. The local development server compiles and responds on port 3000.

The browser connector is unavailable in this session, so screenshot review, manual keyboard/screen-reader checks, visual checks at all planned widths, and live task timing remain unverified. The automated phone-layout checks do not establish full accessibility conformance.

Backend source inspection confirmed record lookup routes and the 100-row pagination cap. Collection queries now read all server pages with bounded concurrency so searches and selectors cover the loaded collection completely. Very large datasets still require a separate server-search/sorting implementation; no unverified backend query parameters were introduced.

The navigation uses “Locations” while retaining “Company” for the underlying records and forms. A domain terminology change, dependency upgrades, and additional server capabilities remain separate decisions described below.

## Outcome and confirmed priorities

Make everyday tasks easier to find, complete, and recover from across the platform. The redesign should give users a consistent visual language, clear context between related pages, and reliable feedback when loading or saving data.

Confirmed visual direction: a clean, restrained business application with clear hierarchy. Confirmed first pilot: locations → leases → wells, focused on navigation between related pages.

The proposed visual treatment uses neutral surfaces, a dark navigation rail, one blue accent, readable tables, and modest spacing. Begin with the shared shell and the confirmed pilot; detailed colors, spacing, and component treatments will be reviewed in the first design pass.

This draft comes from source review. A walkthrough of the live interface with representative data and each role is an implementation kickoff task; observed usability metrics have not yet been collected.

## Findings that shape the work

| Current evidence | User impact | Planned response |
| --- | --- | --- |
| [Home.js](../src/Home.js) and [PageTitle.js](../src/components/PageTitle.js) both render an `h1`; page padding varies. | Repeated headings and inconsistent page structure. | One page heading, common content padding, breadcrumbs, and a predictable action area. |
| [LeaseManagement.js](../src/Admin/LeaseManagement.js), Well Management, Pricing, and other child pages read required IDs from `location.state`. | Opening a direct link or new tab without navigation state can fail. | Put record context in the URL, recover data by ID, and handle missing or inaccessible parents. |
| Management and operations tables commonly set `search: false` and fetch fixed limits of 100 or 1,000 records. | Finding records is difficult; a loaded subset can be mistaken for the complete dataset. | Consistent search/filter controls with an explicit data scope and verified pagination. |
| Several mutation handlers catch errors without rejecting their table edit promises. | The editor can close after a failed save, making the result unclear. | Keep failed edits open, preserve input, and show an actionable error. |
| [LocationManagement.js](../src/Admin/LocationManagement.js) uses companies in its API and heading, while navigation says locations. | Users encounter different names for the same entry point. | Confirm terminology and use the chosen term across navigation, headings, forms, and reports. |
| [Delivery.js](../src/WorkOrders/Delivery.js) and [ShippingPapers.js](../src/WorkOrders/ShippingPapers.js) use 1,000px-wide map modals. | Dialogs can exceed small screens. | Responsive dialogs with bounded height and accessible close controls. |
| [ClientSwitcher.js](../src/components/ClientSwitcher.js) already resets query cache and dashboard filters on a switch. | Tenant context is important across every workflow. | Preserve that behavior and also reset incompatible page context, selections, and drafts. |
| Dashboard and reports already provide useful cards, filters, loading, and empty states. | There are existing patterns to build on. | Refine and share these patterns across the remaining pages. |

## Shared visual and interaction system

### Visual direction

| Element | Proposed baseline |
| --- | --- |
| Palette | Canvas `#F8FAFC`, surfaces `#FFFFFF`, primary text `#0F172A`, secondary text `#475569`, navigation `#0F172A`, accent `#2563EB`. Validate final combinations for contrast. |
| Typography | Use the existing system font stack. Body text 14–16px; page titles 24–28px; consistent numeric and currency alignment. |
| Spacing | A shared 4/8px scale, with 16px mobile and 24–32px desktop page gutters. |
| Surfaces | Subtle borders, small shadows where hierarchy needs them, and consistent 8–12px corner radii. |
| Density | A comfortable default; assess a compact table option with people who use the platform daily. |
| Actions | One labeled primary action per page. Visible names for frequent actions such as “View leases”; secondary actions in a labeled menu. |
| Status | Plain text labels with supporting color and icons. Confirm the meaning of existing `active`/completed values before relabeling. |
| Motion | Short transitions that preserve focus and layout; respect reduced-motion preferences. |

### App shell and page layout

- Keep familiar navigation groups initially: Dashboard, Work Orders, Reports, Administration, and Platform for superadmins. Use role checks from `permissions.js`.
- Give the current section a clear selected state. On mobile, close the navigation after a destination is selected and restore focus appropriately.
- Keep client context visible and labeled; place account and sign-out actions in an account menu.
- Use a shared page header with one `h1`, optional description, breadcrumbs, record context, and a primary action.
- Keep sidebar preference stable across navigation. Use an overlay drawer on narrow screens and avoid obscuring page actions.
- Use shared route metadata for navigation labels, document titles, breadcrumbs, and page headings.

Proposed pilot layout:

```text
Navigation       Client: Example Client                         Account
                 Companies > Example Company > North Lease

                 Wells                                        + Add well
                 Wells for North Lease · Example Company

                 Search wells                  Filters · Clear filters
                 -----------------------------------------------------
                 Well name         Location         Status     Actions
                 ...
                 -----------------------------------------------------
                 Results count                         Page controls
```

### Tables, forms, and feedback

- Build a shared table adapter around the existing `config/MaterialTable.js`. Centralize toolbar placement, action labels, pagination, density, loading, empty results, and error recovery.
- Restore search, filters, sorting, page size, and page position when users return from a child page. Scope persistent preferences by client, user, and page.
- Store shareable filters and parent record IDs in query parameters. Clamp invalid page values and reset the page when filters change.
- Distinguish “no records yet,” “no matching results,” “choose a parent/filter,” “loading,” and “request failed.” Give each state a relevant action.
- Keep useful rows visible during same-context background refresh. Clear old rows when the client or parent context changes.
- Use inline editing for short, simple changes. Use a focused dialog or detail panel for multi-field records and dependent selections; use a full-screen form on small screens.
- Put validation beside the relevant field, focus the first error, retain failed input, prevent duplicate submissions, and close only after a successful mutation.
- Warn before leaving a dirty form, including during client switching. Use a named confirmation dialog for destructive actions and restore focus to its trigger.
- Use lightweight success messages and persistent, actionable errors. Queue notifications so they do not cover one another or essential controls.
- Label quantities and units from confirmed domain/API definitions. Use consistent date and currency formatting; define date boundaries and timezone behavior before changing report filters.

## Navigation and workflow changes

### Pilot: companies/locations → leases → wells, with pricing alongside

1. Find a company using search and clear row actions.
2. Open its leases with the company name and breadcrumb visible.
3. Open a lease's wells while retaining both parent IDs and names.
4. Add or edit a record with inline validation and reliable save feedback.
5. Return through breadcrumbs or browser Back to the previous list and its filters/page.
6. Open company pricing from the same company context.

Preserve the existing route paths, including `/locationmanagment` and its misspelled child paths. Add URL context such as `/locationmanagment/leasemanagment?companyId=...` and `/locationmanagment/leasemanagment/wellmanagment?companyId=...&leaseId=...`. Treat `location.state` as optional display assistance. Verify that records belong to the selected parent and client before rendering them.

Resolve parent names through a verified API contract. The current frontend exposes list endpoints; confirm single-record lookup support or add it with the backend. Do not recover context by assuming a capped list contains every record. Existing links without IDs should lead to a useful parent-selection state.

### Other workflows

| Area / current screens | Proposed interaction |
| --- | --- |
| Dashboard | Put pending work and useful summaries first. Let relevant cards open filtered lists. Keep filters visible and show independent widget loading/error states. |
| Company/location list | Searchable list, clear “View leases” and “Pricing” actions, and one consistent create/edit form. |
| Leases and wells | Parent-aware headers, breadcrumbs, shareable context, reliable Back behavior, and clear create/edit feedback. |
| Pricing | Show the company in the header; searchable product selection, explicit currency, numeric validation, and clear save results. |
| Warehouses | Searchable list with a labeled inventory action and consistent record forms. |
| Warehouse chemicals | Keep the warehouse name visible; searchable product selection and validated quantities. Make mutations distinct from the read-only inventory report. |
| Products/chemicals | Consistent terminology, searchable catalog, and readable field labels. Preserve existing domain fields and validation rules. |
| Shipping papers | Clear completed status, readable origin/destination details, a responsive map, and an obvious chemicals action. |
| Shipping chemicals | Keep the shipping paper identifier visible; searchable products and validated quantities. Return to the same parent list state. |
| Deliveries | Company → lease → well selectors scoped to their parent. Reset invalid child selections when a parent changes. Clear completion and map actions. |
| Delivery chemicals (`EditDelivery.js`) | Name the page for the task it actually performs; retain the delivery identifier and parent list position. |
| Earnings report | Reuse the existing presets and summaries; standardize filter layout, loading, error recovery, and export progress. |
| Inventory Levels report | Clear warehouse selection, quantity presentation, empty/error states, and consistent export controls where supported. |
| User Report | Clear selected-user/date context, role-appropriate filters, and consistent report/export behavior. |
| Users | Searchable users, clearer role labels, focused create/edit forms, and named password-reset/deactivation confirmations. Preserve assignable-role rules. |
| Clients | Clearly separated platform administration, visible active/inactive state, and explicit details and status-change actions. |
| Sign in, registration, password recovery | Shared visual treatment, labeled fields, password visibility controls, pending states, and useful errors. Preserve the existing authentication contracts. |

Shipping papers and deliveries remain distinct workflows. Saving a parent record and saving its chemical lines currently use separate requests; the UI must report partial failures accurately and allow retry without recreating the parent.

## Delivery sequence

| Phase | Deliverable | Completion condition |
| --- | --- | --- |
| 0. Baseline | Live walkthroughs, representative data, task/viewport captures, terminology decisions, and usable test setup. | Record baseline task steps and friction. Repair the stale starter App test and existing Jest dependency-parsing issue before relying on broad regression tests. |
| 1. Shared foundation | Theme tokens, app shell, route metadata, page header, breadcrumbs, and shared feedback primitives. | The shell works for user/admin/superadmin and at desktop, tablet, and phone widths. One clear page heading and visible client context. |
| 2. Workflow pilot | Companies/locations, leases, wells, and contextual pricing, using the shared table/form patterns. | Direct links, new tabs, browser Back/Forward, failed saves, and missing parents behave predictably. Review desktop and mobile pilot screens before wider rollout. |
| 3. Administration | Warehouses, warehouse inventory editing, products, users, and clients. | Consistent table actions and forms; role rules and client boundaries pass regression checks. |
| 4. Operations | Shipping papers/chemicals and deliveries/chemicals, including map dialogs and dependent selectors. | Main tasks work with keyboard/touch, retain context, and accurately recover from partial failures. |
| 5. Dashboard, reports, authentication | Refined dashboard hierarchy, shared report filters/export feedback, and aligned authentication screens. | Filters, summaries, exports, pending states, and errors use the same conventions. |
| 6. Release review | Cross-role workflow checks, accessibility review, responsive checks, and performance comparison. | Agreed acceptance checks pass and remaining limitations are documented. |

Each implementation slice should include its behavior checks and be reviewable on its own. Preserve a working platform between slices. Schedule estimates follow the pilot and confirmation of any backend work.

## Technical approach and dependencies

- Establish shared theme tokens with the existing React/Material-UI stack first. Put visual decisions in one place and migrate scattered styles incrementally.
- Keep RTK Query as the server-state layer. Local form drafts stay local; URL state holds navigation/filter context; shared UI preferences use the existing Redux slices where appropriate.
- Introduce a table adapter so a later table-library replacement can be evaluated once and adopted without redesigning every page. Retain the existing compatibility patches until a replacement is validated.
- Evaluate React, Material-UI, table, date picker, map, and build-tool upgrades as a separate technical decision after the pilot. Verify compatibility and migration cost before choosing versions or replacement libraries.
- Verify backend pagination metadata and supported filters/search/sorting. Current API adapters expose only selected query fields; sending new parameters does not establish backend support.
- Until complete server search is available, clearly identify searches of loaded records. Avoid presenting capped client-side results as global search or complete totals.
- Confirm lookup endpoints and use pagination or server-backed autocomplete for large company, lease, well, product, client, and user selectors.
- New bulk actions, saved server-side views, draft synchronization, and cross-device preferences are later candidates requiring their own API/data decisions.

## Acceptance checks

- A user can complete the pilot workflow without guessing the meaning of primary action icons.
- Valid direct links and new tabs reconstruct the correct context. Missing, deleted, inaccessible, or mismatched records show a helpful recovery state.
- Browser Back/Forward and breadcrumbs preserve relevant parent filters, sorting, and pagination.
- Failed saves preserve entered values and leave the editor open; repeated clicks do not create duplicate requests.
- Changing a company clears incompatible leases/wells. Changing a client clears old rows, cached data, selections, and incompatible route/form context.
- Every migrated page has useful initial loading, background refresh, empty, no-results, and failure states.
- Existing user/admin/superadmin read and write permissions remain correct, including role assignment and report visibility.
- Validate layouts at 360px, 768px, 1280px, and a wide desktop viewport. Test zoom separately. Page controls remain reachable; wide tables may scroll within their own container.
- Target WCAG 2.2 AA and review keyboard operation, visible focus, meaningful labels, field errors, status announcements, contrast, and reflow against the [W3C quick reference](https://www.w3.org/WAI/WCAG22/quickref/). Prefer 44px touch controls as a product design target; this does not by itself establish conformance.
- Existing totals, date filtering, exports, maps, and CRUD outcomes remain correct with representative records and failed requests.
- Compare task completion steps/time, task errors, visible data completeness, and route responsiveness against the Phase 0 baseline. Set measurable improvement targets after that baseline rather than inventing current performance numbers.

## Initial implementation backlog

| Order | Work item | Main files / area |
| --- | --- | --- |
| UI-01 | Capture baseline workflows and repair the test entry point. | `src/App.test.js`, test configuration, representative fixtures |
| UI-02 | Add theme tokens and the shared page/header structure. | `src/App.js`, `src/Home.js`, `src/components/PageTitle.js`, shared styles |
| UI-03 | Consolidate route labels, breadcrumbs, sidebar behavior, and client context. | `src/Home.js`, `src/Dashboard/listItems.js`, `src/components/ClientSwitcher.js` |
| UI-04 | Add robust URL context and missing-parent recovery for the pilot. | Location/Lease/Well Management, Pricing, relevant API adapters |
| UI-05 | Create shared table, form, confirmation, and query-state patterns; migrate the pilot. | `src/config/MaterialTable.js`, new shared UI components |
| UI-06 | Apply those patterns to remaining administration screens. | `src/Admin/` |
| UI-07 | Refine operations and make map dialogs responsive. | `src/WorkOrders/`, `src/config/MapView.js` |
| UI-08 | Align dashboard/report filters, state handling, and export feedback. | `src/Dashboard/`, `src/Reports/` |
| UI-09 | Align sign-in, registration, and password recovery. | `src/Login.js`, `src/Register.js`, `src/ForgotPassword.js` |
| UI-10 | Complete cross-role, client-switching, responsive, accessibility, and performance review. | Migrated workflows and regression checks |

## Confirmed decisions

- Visual direction: clean, restrained business UI with clear hierarchy.
- First pilot: locations → leases → wells, improving navigation between pages.

## Remaining decisions

1. The relationship and preferred wording for “company” and “location.” “Client” continues to mean the tenant and must remain distinct.
2. Devices most used in the field, typical record volumes, and tasks users repeat most often.
3. Which multi-field edits need a dedicated form and which short edits should remain inline.

The first concrete design review should show the shared shell and the locations → leases → wells pilot in desktop and phone layouts, including loading, empty, failure, and editing states.
