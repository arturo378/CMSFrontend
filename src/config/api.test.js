import api from './api';
import { setActiveClientId } from './clientContext';

beforeEach(() => { localStorage.clear(); global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; localStorage.clear(); });
const response = body => ({ ok: true, json: async () => body });

test('loads every page and retains query filters when a list is larger than the server cap', async () => {
  fetch.mockImplementation(async url => {
    const request = new URL(url);
    expect(request.searchParams.get('company')).toBe('company-a');
    expect(request.searchParams.get('limit')).toBe('100');
    const page = Number(request.searchParams.get('page'));
    return response({ data: [{ _id: 'record-' + page }], totalPages: 3, totalItems: 3, page, limit: 1 });
  });
  const result = await api.getAll('/api/leases?company=company-a&limit=1000');
  expect(result.data.map(row => row.id)).toEqual(['record-1', 'record-2', 'record-3']);
  expect(result.totalItems).toBe(3);
  expect(fetch).toHaveBeenCalledTimes(3);
});

test('discards an in-flight collection when the active client changes', async () => {
  setActiveClientId('client-a');
  fetch.mockImplementation(async () => {
    setActiveClientId('client-b');
    return response({ data: [{ _id: 'old-client-record' }], totalPages: 2 });
  });
  await expect(api.getAll('/api/companies')).rejects.toThrow('Client context changed');
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('rejects a failed later page rather than returning a partial searchable list', async () => {
  fetch.mockResolvedValueOnce(response({ data: [{ _id: 'one' }], totalPages: 2 }))
    .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ message: 'Service unavailable' }) });
  await expect(api.getAll('/api/companies')).rejects.toThrow('Service unavailable');
});
