import { demoRequest } from './api';

const readable = ['companies', 'leases', 'wells', 'warehouses', 'chemicals', 'warehouse-chemicals'];
const writable = ['shipping-papers', 'shipping-chemicals', 'deliveries', 'delivery-chemicals', 'warehouse-chemicals'];

// The mobile API uses Mongo-style _id fields; the frontend uses normalized id.
export function toMobileResponse(value) {
  if (Array.isArray(value)) return value.map(toMobileResponse);
  if (!value || typeof value !== 'object') return value;
  const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toMobileResponse(item)]));
  if (result.id) result._id = result.id;
  return result;
}

export async function handleMobileRequest({ method, path, body }, client) {
  const url = new URL(path, 'https://demo.local');
  const [, prefix, collection, id, extra] = url.pathname.split('/');
  const auth = collection === 'auth' && ((method === 'GET' && id === 'me') || (method === 'POST' && id === 'logout'));
  const read = method === 'GET' && readable.includes(collection) && !id;
  const write = writable.includes(collection) && ((method === 'POST' && !id) || (method === 'PUT' && id));
  if (url.origin !== 'https://demo.local' || prefix !== 'api' || extra || !(auth || read || write)) {
    throw Object.assign(new Error('Unsupported mobile demo request'), { status: 403 });
  }
  // These shipments adjust warehouse stock as the mobile workflow progresses.
  // The inventory report must not apply the same transfer a second time.
  const fields = collection === 'shipping-papers' && method === 'POST' ? { ...body, inventoryApplied: true } : body;
  return toMobileResponse(await demoRequest(method, url.pathname + url.search, fields, client));
}

export function getMobileDemoSession() {
  const key = 'cms.demo.mobile.session';
  try {
    let value = localStorage.getItem(key);
    if (!value) { value = `${Date.now()}-${Math.random().toString(36).slice(2)}`; localStorage.setItem(key, value); }
    return value;
  } catch { return 'memory'; }
}
