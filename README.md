# CMSFrontend

Chemical Management System - Frontend Application

## Demo mode

This branch enables `REACT_APP_DEMO_MODE=true` in `.env`. Run `npm start` to
open the application without starting or configuring a backend. `npm run build`
also produces a standalone demo build suitable for static hosting.

The demo opens as **Demo Superuser** with the application's `superadmin` role,
including administration, client management, client switching, work orders,
chemical details, charts, reports, and exports. No login credentials are needed.
After signing out, choose **Enter demo** to return.

Two fictional clients have separate companies, leases, wells, warehouses,
products, prices, users, deliveries, shipping papers, and inventory. Dates are
relative to the day the data is first created. Choose a company on the dashboard
to populate its revenue and chemical charts; reports have their usual company,
warehouse, or user selectors.

Add, edit, delete, and deactivate actions use browser-local sample data. Reports
are calculated from that data, including completed shipping transfers in warehouse
inventory. Changes survive reloads. **Reset demo data** restores the sample records,
refreshes their dates, clears the demo client selection, and returns to the dashboard.
The demo's storage is separate from real login credentials and client selections.
The demo superuser and home client remain active to preserve access.

All API requests stay in the browser while demo mode is enabled, including
unsupported requests. Password-reset actions are simulated and send no email.
Map tiles and the existing icon font still use public internet services.

To use the real backend again, set `REACT_APP_DEMO_MODE=false` in `.env.local`
(or the build environment), configure `REACT_APP_API_URL`, and restart/rebuild.
This is a build-time setting; changing it requires restarting the development server
or rebuilding the static bundle. A demo build always grants local superadmin access.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

Dependency installation, `npm start`, and `npm run build` run
`scripts/patch-material-table.js` to correct the `defaultExpanded` prop-type
validator in material-table 1.63.0. Applying the patch also clears Webpack's
cached dependency bundles. Restart a running development server after the
patch is first applied.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
