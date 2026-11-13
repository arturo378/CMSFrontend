import React from 'react';
import { Provider } from 'react-redux';
import { render, fireEvent, wait, cleanup, act } from '@testing-library/react';
import App from './App';
import { createAppStore } from './store';
import { baseApi } from './store/api/baseApi';
import { paths } from './config/routes';
import { exportAoaToXlsx } from './config/excelExport';

jest.mock('./config/excelExport', () => ({ exportAoaToXlsx: jest.fn().mockResolvedValue(undefined) }));

const company = { id: '111111111111111111111111', name: 'Example Company', city: 'Midland', state: 'TX' };
const lease = { id: '222222222222222222222222', name: 'North lease', company };
const well = { id: '333333333333333333333333', name: 'Well 7', lease, company, gps: '31, -99' };
const user = { id: '444444444444444444444444', fullname: 'Example Admin', role: 'admin', clientId: '555555555555555555555555' };
const otherClient = { id: '666666666666666666666666', name: 'Second client', status: 'active' };
const otherCompany = { ...company, id: '777777777777777777777777', name: 'Second Company' };
const originalMatchMedia = window.matchMedia;
let store;
const page = rows => ({ data: rows, page: 1, limit: 100, totalPages: 1, totalItems: rows.length });
function start(path, role = 'admin', width = 1280) {
  window.matchMedia = jest.fn(query => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    return { matches: Boolean(max && width <= Number(max[1])), media: query, addListener: jest.fn(), removeListener: jest.fn() };
  });
  const currentUser = { ...user, role };
  localStorage.setItem('currentUser', JSON.stringify(currentUser)); localStorage.setItem('accessToken', 'test-token');
  window.history.replaceState({}, '', path);
  global.fetch = jest.fn(async (url, options) => {
    const request = new URL(url); let body; const pathname = request.pathname.replace(/\/$/, '');
    if (pathname === '/api/auth/me') body = { user: currentUser };
    else if (pathname === '/api/clients') body = page([otherClient]);
    else if (pathname === '/api/companies') body = page([options.headers['X-Client-Id'] === otherClient.id ? otherCompany : company]);
    else if (pathname === '/api/companies/' + company.id) body = company;
    else if (pathname === '/api/leases') body = page([lease]);
    else if (pathname === '/api/leases/' + lease.id) body = lease;
    else if (pathname === '/api/wells') body = page([well]);
    else if (['/api/deliveries', '/api/shipping-papers', '/api/chemicals', '/api/warehouse-chemicals', '/api/warehouses', '/api/pricing'].includes(pathname)) body = page([]);
    else if (pathname === '/api/users') body = page([currentUser]);
    else if (pathname === '/api/reports/weekly-earnings') body = [{ date: '2026-11-06T12:00:00Z', datanumber: 'Delivery-1', lease: lease.name, well: well.name, chemical: 'Product A', price: 12.5, quantity: 2, total: 25 }];
    else if (pathname === '/api/reports/user-activity') body = { deliveries: [{ id: 'record', datanumber: 'Own delivery', company, lease, well, date: '2026-11-06T12:00:00Z' }], shippingPapers: [] };
    else return { ok: false, status: 404, json: async () => ({ message: 'Not found' }) };
    return { ok: true, json: async () => body };
  });
  store = createAppStore({ auth: { user: currentUser, accessToken: 'test-token', status: 'idle', error: null } });
  return render(<Provider store={store}><App /></Provider>);
}
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); jest.clearAllMocks(); });
afterEach(() => { cleanup(); store?.dispatch(baseApi.util.resetApiState()); localStorage.clear(); sessionStorage.clear(); window.matchMedia = originalMatchMedia; delete global.fetch; });

test('opens a lease direct link, navigates to wells, and returns with parent context', async () => {
  const view = start(paths.leases + '?companyId=' + company.id);
  await view.findByText('North lease');
  expect(view.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(view.getByRole('heading', { name: 'Leases' })).toBeInTheDocument();
  expect(document.title).toBe('Leases · Chemical Management System');
  fireEvent.click(view.getByText('View wells'));
  await view.findByText('Well 7');
  expect(window.location.search).toContain('leaseId=' + lease.id);
  expect(window.location.search).toContain('companyId=' + company.id);
  fireEvent.click(view.getByRole('link', { name: 'Example Company' }));
  await view.findByText('View wells');
  expect(window.location.pathname).toBe(paths.leases);
  expect(window.location.search).toContain(company.id);
});

test('a child page without a parent shows a useful recovery action without requesting unscoped records', async () => {
  const view = start(paths.leases);
  await view.findByText('Choose a parent record');
  expect(view.getByRole('link', { name: 'Choose a company' })).toHaveAttribute('href', paths.locations);
  expect(fetch.mock.calls.some(([url]) => new URL(url).pathname === '/api/leases')).toBe(false);
});

test('a mismatched company and lease cannot load or edit wells', async () => {
  const view = start(paths.wells + '?leaseId=' + lease.id + '&companyId=999999999999999999999999');
  await view.findByText('The selected company and lease do not match');
  expect(fetch.mock.calls.some(([url]) => new URL(url).pathname === '/api/wells')).toBe(false);
});

test('a missing parent reports an unavailable record and offers a safe way back', async () => {
  const view = start(paths.leases + '?companyId=999999999999999999999999');
  await view.findByText('This record is unavailable');
  expect(view.getByText('Try again')).toBeInTheDocument();
});

test('a read-only user can inspect deliveries but cannot create or edit them', async () => {
  const view = start(paths.deliveries, 'user');
  await view.findByRole('heading', { name: 'Deliveries' });
  await wait(() => expect(fetch.mock.calls.some(([url]) => new URL(url).pathname === '/api/deliveries')).toBe(true));
  expect(view.queryByText('Add delivery')).toBeNull();
  expect(view.queryByRole('link', { name: 'Users' })).toBeNull();
  expect(view.queryByRole('link', { name: 'Clients' })).toBeNull();
});

test('search and compact-view preferences survive a round trip through a child page', async () => {
  const view = start(paths.locations);
  await view.findByText('Example Company');
  fireEvent.change(view.getByPlaceholderText('Search records'), { target: { value: 'Example' } });
  await wait(() => expect(window.location.search).toContain('q=Example'));
  fireEvent.click(view.getByText('Compact view'));
  fireEvent.click(view.getByText('View leases'));
  await view.findByText('North lease');
  await act(async () => { window.history.back(); });
  await view.findByText('View leases');
  expect(view.getByPlaceholderText('Search records')).toHaveValue('Example');
  expect(view.getByText('Comfortable view')).toBeInTheDocument();
});

test('switching clients clears child context and replaces the visible dataset', async () => {
  const view = start(paths.leases + '?companyId=' + company.id, 'superadmin');
  await view.findByText('North lease');
  await wait(() => expect(fetch.mock.calls.some(([url]) => new URL(url).pathname === '/api/clients')).toBe(true));
  fireEvent.mouseDown(view.getByLabelText('Client workspace'));
  fireEvent.click(await view.findByRole('option', { name: 'Second client' }));
  await view.findByText('Second Company');
  expect(window.location.pathname).toBe(paths.locations);
  expect(window.location.search).toBe('');
  expect(view.queryByText('North lease')).toBeNull();
  expect(localStorage.getItem('activeClientId')).toBe(otherClient.id);
  expect(fetch.mock.calls.some(([url, options]) => new URL(url).pathname === '/api/companies' && options.headers['X-Client-Id'] === otherClient.id)).toBe(true);
});

test('phone layouts use a temporary navigation drawer and a full-screen record form', async () => {
  const view = start(paths.locations, 'admin', 360);
  await view.findByText('Example Company');
  fireEvent.click(view.getByLabelText('Open navigation'));
  expect(view.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  fireEvent.click(view.getByRole('link', { name: 'Users' }));
  await view.findByRole('heading', { name: 'Users' });
  await wait(() => expect(document.querySelector('.MuiDrawer-modal')).toHaveAttribute('aria-hidden', 'true'));
  fireEvent.click(view.getByText('Add user'));
  expect(document.querySelector('.MuiDialog-paperFullScreen')).toBeInTheDocument();
  expect(view.getByLabelText(/Full name/)).toBeInTheDocument();
});

test('earnings exports use the displayed totals and provide a pending state', async () => {
  const view = start('/weeklyearnings?companyId=' + company.id + '&from=2026-11-01&to=2026-11-12&range=custom');
  await view.findByText('Product A');
  let finishExport;
  exportAoaToXlsx.mockImplementationOnce(() => new Promise(resolve => { finishExport = resolve; }));
  fireEvent.click(view.getByText('Download Excel'));
  expect(view.getByText('Preparing Excel…').closest('button')).toBeDisabled();
  expect(exportAoaToXlsx).toHaveBeenCalledTimes(1);
  const [rows, filename] = exportAoaToXlsx.mock.calls[0];
  expect(filename).toBe('Weekly_Report.xlsx');
  expect(rows[1]).toContain('Product A');
  expect(rows[rows.length - 1].slice(-2)).toEqual([2, 25]);
  const reportUrl = new URL(fetch.mock.calls.find(([url]) => new URL(url).pathname === '/api/reports/weekly-earnings')[0]);
  expect(new Date(reportUrl.searchParams.get('endDate')).getHours()).toBe(23);
  await act(async () => { finishExport(); });
  await wait(() => expect(view.getByText('Download Excel').closest('button')).not.toBeDisabled());
});

test('a read-only activity report always requests the current user even if the URL names another user', async () => {
  const view = start('/userReport?userId=999999999999999999999999', 'user');
  await view.findByText('Own delivery');
  const reportUrl = new URL(fetch.mock.calls.find(([url]) => new URL(url).pathname === '/api/reports/user-activity')[0]);
  expect(reportUrl.searchParams.get('userId')).toBe(user.id);
  expect(view.queryByLabelText('User')).toBeNull();
});
