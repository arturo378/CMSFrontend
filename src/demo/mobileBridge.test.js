import { demoRequest, resetDemoData } from './api';
import { handleMobileRequest, getMobileDemoSession } from './mobileBridge';
import { DEMO_USER } from '../config/demoMode';

beforeEach(() => { localStorage.clear(); resetDemoData(); });
const request = (method, path, body, client) => handleMobileRequest({ method, path, body }, client);

test('normalizes record IDs for the mobile app, including populated chemicals', async () => {
  const { data } = await request('GET', '/api/warehouse-chemicals?warehouse=permian-warehouse-0');
  expect(data).toHaveLength(4);
  expect(data[0]._id).toBe(data[0].id);
  expect(data[0].chemical._id).toBe(data[0].chemical.id);
  expect((await request('GET', '/api/auth/me')).user.id).toBe(DEMO_USER.id);
});

test('mobile shipments and deliveries are visible in the frontend API', async () => {
  const paper = await request('POST', '/api/shipping-papers', {
    originwarehousenumber: 'WH-101', destinationwarehousenumber: 'WH-102', trucknumber: 'DEMO-101', active: 0,
  });
  await request('POST', '/api/shipping-chemicals', { shippingPaper: paper._id, chemical: 'permian-chemical-0', quantity: 100 });
  const delivery = await request('POST', '/api/deliveries', {
    company: 'permian-company-0', lease: 'permian-lease-0', well: 'permian-well-0-0', active: 0,
  });
  await request('POST', '/api/delivery-chemicals', { delivery: delivery._id, chemical: 'permian-chemical-0', quantity: 25 });
  const saved = await demoRequest('GET', `/api/deliveries/${delivery._id}`);
  expect(saved.company.name).toBe('Permian Basin Oil Co.');
  expect(saved.datanumber).toBe(delivery.datanumber);
  expect((await demoRequest('GET', `/api/shipping-papers/${paper._id}`)).active).toBe(0);
});

test('inventory report counts stock changes from mobile transfers exactly once', async () => {
  const before = await demoRequest('GET', '/api/reports/warehouse-inventory');
  const paper = await request('POST', '/api/shipping-papers', {
    originwarehousenumber: 'WH-101', destinationwarehousenumber: 'WH-102', trucknumber: 'DEMO-101', active: 0,
  });
  await request('POST', '/api/shipping-chemicals', { shippingPaper: paper._id, chemical: 'permian-chemical-0', quantity: 100 });
  await request('PUT', '/api/warehouse-chemicals/permian-stock-0-0', { quantity: 500 });
  await request('PUT', '/api/warehouse-chemicals/permian-stock-1-0', { quantity: 775 });
  await request('PUT', `/api/shipping-papers/${paper._id}`, { active: 1 });
  const after = await demoRequest('GET', '/api/reports/warehouse-inventory');
  const quantity = (rows, id) => rows.find((row) => row.id === id).quantity;
  expect(quantity(after, 'permian-warehouse-0-permian-chemical-0') - quantity(before, 'permian-warehouse-0-permian-chemical-0')).toBe(-100);
  expect(quantity(after, 'permian-warehouse-1-permian-chemical-0') - quantity(before, 'permian-warehouse-1-permian-chemical-0')).toBe(75);
});

test('keeps requests in the selected demo client and rejects privileged endpoints', async () => {
  const eagle = await request('GET', '/api/warehouses', undefined, 'demo-client-eagle');
  expect(eagle.data.every((row) => row.client === 'demo-client-eagle')).toBe(true);
  await expect(request('PUT', '/api/warehouse-chemicals/permian-stock-0-0', { quantity: 1 }, 'demo-client-eagle')).rejects.toThrow('Record not found');
  for (const [method, path] of [['GET', '/api/users'], ['POST', '/api/clients'], ['GET', 'https://example.com/api/warehouses'], ['DELETE', '/api/deliveries/test']]) {
    await expect(request(method, path)).rejects.toThrow('Unsupported mobile demo request');
  }
});

test('reset creates a new mobile session so an old cached shipment is not reused', () => {
  const session = getMobileDemoSession();
  expect(getMobileDemoSession()).toBe(session);
  resetDemoData();
  expect(getMobileDemoSession()).not.toBe(session);
});
