import React from 'react';
import { Provider } from 'react-redux';
import { render, fireEvent, waitForElement } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import App from '../App';
import { store } from '../store';
import { baseApi } from '../store/api/baseApi';
import { resetDemoData } from './api';
import { clearActiveClient } from '../store/slices/clientContextSlice';

jest.mock('../config/demoMode', () => ({
  ...jest.requireActual('../config/demoMode'),
  DEMO_MODE: true,
  sessionKey: (key) => `cms.demo.${key}`,
}));
jest.mock('jspdf', () => jest.fn());
// jsdom has no map layout; keep the real data-driven page and table components.
jest.mock('../config/MapView', () => ({
  __esModule: true,
  ...jest.requireActual('../config/MapView'),
  default: () => <div>Map preview</div>,
}));

beforeEach(() => {
  resetDemoData();
  store.dispatch(clearActiveClient());
  store.dispatch(baseApi.util.resetApiState());
  global.fetch = jest.fn();
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  expect(global.fetch).not.toHaveBeenCalled();
  delete global.fetch;
});

test.each([
  ['/usermanagement', 'demo.superadmin', null],
  ['/clientmanagement', 'Permian Chemical Services', null],
  ['/locationmanagment', 'Permian Basin Oil Co.', null],
  ['/warehousemanagement', 'Midland Central', null],
  ['/chemicalmanagement', 'CorroShield X200', null],
  ['/delivery', 'D-1001', null],
  ['/shippingpapers', 'SP-1001', null],
  ['/locationmanagment/leasemanagment', 'North Pad Alpha', { id: 'permian-company-0' }],
  ['/locationmanagment/leasemanagment/wellmanagment', 'Well 1-A', { companyid: 'permian-company-0', leaseid: 'permian-lease-0' }],
  ['/pricing', 'CorroShield X200', { id: 'permian-company-0' }],
  ['/warehousechemical', 'CorroShield X200', { id: 'permian-warehouse-0' }],
  ['/delivery/editdelivery', 'CorroShield X200', { id: 'permian-delivery-0' }],
  ['/shippingchemicals', 'CorroShield X200', { id: 'permian-shipping-0' }],
])('renders populated demo screen %s', async (path, expected, state) => {
  window.history.replaceState({ state }, '', path);
  const screen = render(<Provider store={store}><App /></Provider>);
  await waitForElement(() => screen.getAllByText(expected)[0]);
  expect(screen.getByText(/Demo mode · Superuser/)).toBeInTheDocument();
  expect(screen.getByText('Clients')).toBeInTheDocument();
  screen.unmount();
});

test.each([
  ['/weeklyearnings', 'Company', 'Permian Basin Oil Co.', 'CorroShield X200'],
  ['/warehouseInventory', 'Warehouse', 'Midland Central', 'CorroShield X200'],
  ['/userReport', 'User', 'superadmin@example.com', 'D-1001'],
])('renders filtered demo report %s', async (path, label, selection, expected) => {
  window.history.replaceState({}, '', path);
  const screen = render(<Provider store={store}><App /></Provider>);
  const select = await waitForElement(() => screen.getByLabelText(label));
  // Wait for the underlying options query before opening the MUI menu.
  await act(async () => { await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk())); });
  fireEvent.mouseDown(select);
  const option = await waitForElement(() => screen.getByText(selection));
  fireEvent.click(option);
  await waitForElement(() => screen.getAllByText(expected)[0]);
  screen.unmount();
});

test('renders the demo dashboard with populated KPIs and recent activity', async () => {
  window.history.replaceState({}, '', '/');
  const screen = render(<Provider store={store}><App /></Provider>);
  await waitForElement(() => screen.getAllByText('D-1001')[0]);
  expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  expect(screen.getAllByText('Active Wells')[0]).toBeInTheDocument();
  expect(screen.getByText('Map preview')).toBeInTheDocument();
  screen.unmount();
});
