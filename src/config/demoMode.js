export const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';

export const DEMO_TOKEN = 'cms-local-demo';
export const DEMO_USER = {
  id: 'demo-superadmin',
  username: 'demo.superadmin',
  fullname: 'Demo Superuser',
  name: 'Demo Superuser',
  email: 'superadmin@example.com',
  role: 'superadmin',
  client: 'demo-client-permian',
  status: 'active',
};

// Demo sessions never overwrite a real account's cached credentials.
export const sessionKey = (key) => DEMO_MODE ? `cms.demo.${key}` : key;
