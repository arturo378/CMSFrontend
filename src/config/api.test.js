jest.mock('./demoMode', () => ({
  ...jest.requireActual('./demoMode'), DEMO_MODE: false, sessionKey: (key) => key,
}));

const api = require('./api').default;
const { getCurrentUser, storeAuthSession, clearAuthSession } = require('./api');

afterEach(() => {
  localStorage.clear();
  delete global.fetch;
});

test('uses real authentication and backend requests when demo mode is disabled', async () => {
  expect(getCurrentUser()).toBeNull();
  storeAuthSession({ accessToken: 'real-token', user: { id: 'real', role: 'user' } });
  localStorage.setItem('activeClientId', 'real-client');
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [{ _id: 'chemical-id' }] }) });
  expect(await api.get('/api/chemicals')).toEqual({ data: [{ _id: 'chemical-id', id: 'chemical-id' }] });
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/chemicals'), expect.objectContaining({
    headers: expect.objectContaining({ Authorization: 'Bearer real-token', 'X-Client-Id': 'real-client' }),
    credentials: 'include',
  }));
  expect(getCurrentUser()).toEqual({ id: 'real', role: 'user' });
  clearAuthSession();
  expect(localStorage.getItem('accessToken')).toBeNull();
});
