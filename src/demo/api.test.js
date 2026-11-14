import api, { getCurrentUser, storeAuthSession } from '../config/api';
import { DEMO_USER } from '../config/demoMode';
import { clearActiveClientId, setActiveClientId } from '../config/clientContext';
import { demoRequest, resetDemoData, DEMO_DATA_KEY } from './api';
import { createDemoDatabase } from './data';

jest.mock('../config/demoMode', () => ({
  ...jest.requireActual('../config/demoMode'),
  DEMO_MODE: true,
  sessionKey: (key) => `cms.demo.${key}`,
}));

beforeEach(() => {
  localStorage.clear();
  clearActiveClientId();
  resetDemoData();
  global.fetch = jest.fn(() => Promise.reject(new Error('Unexpected network request')));
});

afterEach(() => {
  expect(global.fetch).not.toHaveBeenCalled();
  delete global.fetch;
});

test('keeps today’s sample work inside report ranges even before 9 AM', () => {
  jest.useFakeTimers('modern');
  try {
    jest.setSystemTime(new Date(2026, 10, 14, 5, 0, 0));
    const db = createDemoDatabase();
    [...db.deliveries, ...db['shipping-papers']].forEach((row) => {
      expect(new Date(row.date).getTime()).toBeLessThanOrEqual(Date.now());
    });
  } finally {
    jest.useRealTimers();
  }
});

test('authenticates as the superadmin without touching real credentials', async () => {
  localStorage.setItem('accessToken', 'real-token');
  localStorage.setItem('currentUser', JSON.stringify({ id: 'real-user', role: 'user' }));
  localStorage.setItem('activeClientId', 'real-client');
  const session = await api.post('/api/auth/login', {});
  storeAuthSession(session);
  expect(session.user.role).toBe('superadmin');
  expect(getCurrentUser()).toEqual(DEMO_USER);
  expect((await api.get('/api/auth/me')).user).toEqual(DEMO_USER);
  await api.post('/api/auth/logout');
  expect(localStorage.getItem('accessToken')).toBe('real-token');
  expect(JSON.parse(localStorage.getItem('currentUser')).id).toBe('real-user');
  expect(localStorage.getItem('activeClientId')).toBe('real-client');
});

test('serves every resource with pagination, populated relationships, and filters', async () => {
  const resources = ['clients', 'users/', 'companies', 'leases', 'wells', 'warehouses', 'chemicals', 'pricing', 'warehouse-chemicals', 'deliveries', 'delivery-chemicals', 'shipping-papers', 'shipping-chemicals'];
  for (const resource of resources) {
    const result = await api.get(`/api/${resource}?limit=1`);
    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBeGreaterThan(1);
  }
  const pending = await api.get('/api/deliveries?active=0&company=permian-company-0');
  expect(pending.data.length).toBeGreaterThan(0);
  pending.data.forEach((row) => {
    expect(row.active).toBe(0);
    expect(row.company.name).toBe('Permian Basin Oil Co.');
    expect(row.lease.id).toBe('permian-lease-0');
    expect(row.well.name).toBeTruthy();
    expect(row.createdBy.fullname).toBeTruthy();
  });
  const first = await api.get('/api/deliveries?limit=2&page=1');
  const second = await api.get('/api/deliveries?limit=2&page=2');
  expect(first.totalItems).toBe(36);
  expect(second.data[0].id).not.toBe(first.data[0].id);
});

test('supports persisted create, edit and delete, then restores the seed on reset', async () => {
  const created = await api.post('/api/chemicals', { tradename: 'Demo product', dottag: 'UN1993', weight: 200 });
  const updated = await api.put(`/api/chemicals/${created.id}`, { tradename: 'Updated product' });
  expect(updated.tradename).toBe('Updated product');
  expect(JSON.parse(localStorage.getItem(DEMO_DATA_KEY)).chemicals.find((c) => c.id === created.id).tradename).toBe('Updated product');
  let reloadedRequest;
  jest.isolateModules(() => { reloadedRequest = require('./api').demoRequest; });
  expect((await reloadedRequest('GET', `/api/chemicals/${created.id}`)).tradename).toBe('Updated product');
  await api.delete(`/api/chemicals/${created.id}`);
  await expect(api.get(`/api/chemicals/${created.id}`)).rejects.toMatchObject({ status: 404 });
  resetDemoData();
  expect((await api.get('/api/chemicals')).totalItems).toBe(4);
});

test('isolates client data and rejects cross-client edits and relationships', async () => {
  const home = await api.get('/api/companies');
  setActiveClientId('demo-client-eagle');
  const other = await api.get('/api/companies');
  expect(other.data.every((c) => c.client === 'demo-client-eagle')).toBe(true);
  expect(other.data.some((c) => c.id === home.data[0].id)).toBe(false);
  await expect(api.put(`/api/companies/${home.data[0].id}`, { name: 'Leaked' })).rejects.toMatchObject({ status: 404 });
  await expect(api.post('/api/leases', { name: 'Invalid', company: home.data[0].id })).rejects.toThrow('valid company');
  const delivery = await api.post('/api/deliveries', { company: 'eagle-company-0', lease: 'eagle-lease-0', well: 'eagle-well-0-0', createdBy: DEMO_USER.id });
  expect(delivery.createdBy.id).toBe(DEMO_USER.id);
  expect(delivery.company.name).toBe('Eagle Ford Oil Co.');
  clearActiveClientId();
  expect((await api.get('/api/companies')).data).toEqual(home.data);
});

test('calculates earnings and user activity from edited delivery chemicals', async () => {
  const delivery = await api.post('/api/deliveries', { company: 'permian-company-0', lease: 'permian-lease-0', well: 'permian-well-0-0', date: '2020-01-15T12:00:00.000Z', active: 1 });
  const chemical = await api.post('/api/delivery-chemicals', { delivery: delivery.id, chemical: 'permian-chemical-0', quantity: 10 });
  const path = '/api/reports/weekly-earnings?company=permian-company-0&startDate=2020-01-15T00:00:00.000Z&endDate=2020-01-15T23:59:59.999Z';
  let earnings = await api.get(path);
  expect(earnings).toHaveLength(1);
  expect(earnings[0]).toMatchObject({ quantity: 10, price: 12.5, total: 125, chemical: 'CorroShield X200', lease: 'North Pad Alpha', well: 'Well 1-A' });
  await api.put(`/api/delivery-chemicals/${chemical.id}`, { quantity: 20 });
  earnings = await api.get(path);
  expect(earnings[0].total).toBe(250);
  const activity = await api.get(`/api/reports/user-activity?userId=${DEMO_USER.id}&startDate=2020-01-15&endDate=2020-01-16`);
  expect(activity.deliveries.map((d) => d.id)).toEqual([delivery.id]);
  await api.delete(`/api/deliveries/${delivery.id}`);
  expect(await api.get(path)).toEqual([]);
  expect((await api.get(`/api/delivery-chemicals?delivery=${delivery.id}`)).data).toEqual([]);
});

test('updates inventory for completed transfers and reverses deleted transfers', async () => {
  const inventory = () => api.get('/api/reports/warehouse-inventory?warehouse=permian-warehouse-0');
  const quantity = (rows) => rows.find((r) => r.chemical === 'CorroShield X200').quantity;
  const before = quantity(await inventory());
  const paper = await api.post('/api/shipping-papers', { originwarehousenumber: 'WH-101', destinationwarehousenumber: 'WH-102', trucknumber: 'DEMO', active: 0 });
  await api.post('/api/shipping-chemicals', { shippingPaper: paper.id, chemical: 'permian-chemical-0', quantity: 25 });
  expect(quantity(await inventory())).toBe(before);
  await api.put(`/api/shipping-papers/${paper.id}`, { active: 1 });
  expect(quantity(await inventory())).toBe(before - 25);
  await api.delete(`/api/shipping-papers/${paper.id}`);
  expect(quantity(await inventory())).toBe(before);
});

test('manages users and clients locally and preserves demo superuser access', async () => {
  const client = await api.post('/api/clients', { name: 'New demo client', code: 'new' });
  expect(client.code).toBe('NEW');
  expect((await api.get(`/api/clients/${client.id}`)).name).toBe('New demo client');
  expect((await api.get('/api/clients?status=active&q=new')).totalItems).toBe(1);
  await api.patch(`/api/clients/${client.id}/deactivate`);
  expect((await api.get('/api/clients?status=inactive')).totalItems).toBe(1);
  await api.patch(`/api/clients/${client.id}`, { status: 'active' });
  const user = await api.post('/api/users', { username: 'new', fullname: 'New User', email: 'new@example.com', password: 'never-store-this', role: 'admin' });
  expect(localStorage.getItem(DEMO_DATA_KEY)).not.toContain('never-store-this');
  expect((await api.post(`/api/users/${user.id}/reset-password`)).message).toContain('No email');
  await api.patch(`/api/users/${user.id}/deactivate`);
  expect((await api.get(`/api/users/${user.id}`)).status).toBe('inactive');
  await expect(api.patch(`/api/users/${DEMO_USER.id}`, { role: 'user' })).rejects.toThrow('full access');
  await expect(api.patch(`/api/users/${DEMO_USER.id}/deactivate`)).rejects.toThrow('stay active');
  await expect(api.patch(`/api/clients/${DEMO_USER.client}/deactivate`)).rejects.toThrow('stay active');
});

test('never falls back to a backend for invalid demo requests', async () => {
  await expect(api.get('/api/not-implemented')).rejects.toMatchObject({ status: 404 });
  await expect(api.post('/api/auth/forgot-password', { email: 'demo@example.com' })).rejects.toThrow('no email');
  await expect(demoRequest('GET', '/api/companies', undefined, 'missing-client')).rejects.toThrow('active demo client');
  await expect(api.post('/api/delivery-chemicals', { delivery: 'permian-delivery-0', chemical: 'permian-chemical-0', quantity: -5 })).rejects.toThrow('non-negative');
});
