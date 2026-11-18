import { DEMO_TOKEN, DEMO_USER } from '../config/demoMode';
import { createDemoDatabase } from './data';

export const DEMO_DATA_KEY = 'cms.demo.data.v1';
let database;

const copy = (value) => JSON.parse(JSON.stringify(value));
const idOf = (value) => value && typeof value === 'object' ? value.id || value._id : value;
const failure = (message, status = 400) => Object.assign(new Error(message), { status });

function getDatabase() {
  if (database) return database;
  const seed = createDemoDatabase();
  try {
    const saved = JSON.parse(localStorage.getItem(DEMO_DATA_KEY));
    if (saved && Object.keys(seed).every((key) => Array.isArray(saved[key]))) database = saved;
  } catch {
    // Corrupt or unavailable browser storage starts a fresh in-memory demo.
  }
  if (!database) {
    database = seed;
    persist();
  }
  return database;
}

function persist() {
  try {
    localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(database));
  } catch {
    // The demo also works when storage is full or disabled (until reload).
  }
}

export function resetDemoData() {
  database = createDemoDatabase();
  persist();
  try { localStorage.removeItem('cms.demo.mobile.session'); } catch { /* Storage may be disabled. */ }
}

const relations = {
  company: 'companies', lease: 'leases', well: 'wells', chemical: 'chemicals',
  warehouse: 'warehouses', delivery: 'deliveries', shippingPaper: 'shipping-papers', createdBy: 'users',
};

function populate(row) {
  const result = { ...row };
  Object.entries(relations).forEach(([field, collection]) => {
    if (row[field]) result[field] = getDatabase()[collection].find((r) => r.id === idOf(row[field]) && (r.client === row.client || (field === 'createdBy' && r.id === DEMO_USER.id))) || null;
  });
  return result;
}

function inDateRange(row, params) {
  const time = new Date(row.date).getTime();
  const start = params.get('startDate');
  const end = params.get('endDate');
  return (!start || time >= new Date(start).getTime()) && (!end || time <= new Date(end).getTime());
}

function report(name, params, client) {
  const db = getDatabase();
  const scoped = (key) => db[key].filter((row) => row.client === client);
  if (name === 'weekly-earnings') {
    const deliveries = scoped('deliveries').filter((d) => Number(d.active) === 1 && (!params.get('company') || d.company === params.get('company')) && inDateRange(d, params));
    return deliveries.flatMap((delivery) => scoped('delivery-chemicals').filter((item) => item.delivery === delivery.id).map((item) => {
      const row = populate(delivery);
      const chemical = db.chemicals.find((c) => c.id === item.chemical);
      const price = Number(scoped('pricing').find((p) => p.company === delivery.company && p.chemical === item.chemical)?.price) || 0;
      return { id: item.id, datanumber: delivery.datanumber, date: delivery.date, company: row.company?.name || '', lease: row.lease?.name || '', well: row.well?.name || '', gps: delivery.gps, chemical: chemical?.tradename || '', price, quantity: Number(item.quantity), total: Number((price * Number(item.quantity)).toFixed(2)) };
    }));
  }
  if (name === 'warehouse-inventory') {
    const quantities = new Map();
    const add = (warehouse, chemical, quantity) => {
      const key = `${warehouse}:${chemical}`;
      const item = quantities.get(key) || { warehouse, chemical, quantity: 0 };
      item.quantity += Number(quantity) || 0;
      quantities.set(key, item);
    };
    scoped('warehouse-chemicals').forEach((item) => add(item.warehouse, item.chemical, item.quantity));
    scoped('shipping-papers').filter((paper) => Number(paper.active) === 1 && !paper.inventoryApplied).forEach((paper) => {
      const origin = scoped('warehouses').find((w) => w.warehousenumber === paper.originwarehousenumber);
      const destination = scoped('warehouses').find((w) => w.warehousenumber === paper.destinationwarehousenumber);
      scoped('shipping-chemicals').filter((item) => item.shippingPaper === paper.id).forEach((item) => {
        if (origin) add(origin.id, item.chemical, -Number(item.quantity));
        if (destination) add(destination.id, item.chemical, item.quantity);
      });
    });
    return Array.from(quantities.values()).filter((item) => !params.get('warehouse') || item.warehouse === params.get('warehouse')).map((item) => {
      const warehouse = db.warehouses.find((w) => w.id === item.warehouse);
      return { id: `${item.warehouse}-${item.chemical}`, warehouse: warehouse?.name || '', chemical: db.chemicals.find((c) => c.id === item.chemical)?.tradename || '', quantity: item.quantity, areamanager: warehouse?.areamanager || '' };
    });
  }
  if (name === 'user-activity') {
    const activity = (key) => scoped(key).filter((row) => (!params.get('userId') || row.createdBy === params.get('userId')) && inDateRange(row, params)).map(populate);
    return { deliveries: activity('deliveries'), shippingPapers: activity('shipping-papers') };
  }
  throw failure(`Unknown demo report: ${name}`, 404);
}

function cleanBody(body) {
  const result = {};
  Object.entries(copy(body || {})).forEach(([key, value]) => {
    // Never retain passwords or material-table's internal row metadata.
    if (value !== undefined && !['password', 'confirmPassword', 'tableData', 'id', '_id', 'client', 'createdAt'].includes(key)) {
      result[key] = relations[key] ? idOf(value) : value;
    }
  });
  return result;
}

function validate(collection, row, previous) {
  const db = getDatabase();
  const required = {
    clients: ['name', 'code'], users: ['username', 'email'], companies: ['name'],
    leases: ['name', 'company'], wells: ['name', 'lease', 'company'], warehouses: ['name', 'warehousenumber'],
    chemicals: ['tradename'], pricing: ['company', 'chemical', 'price'],
    'warehouse-chemicals': ['warehouse', 'chemical', 'quantity'],
    deliveries: ['company', 'lease', 'well'], 'delivery-chemicals': ['delivery', 'chemical', 'quantity'],
    'shipping-papers': ['originwarehousenumber', 'destinationwarehousenumber', 'trucknumber'],
    'shipping-chemicals': ['shippingPaper', 'chemical', 'quantity'],
  };
  (required[collection] || []).forEach((field) => {
    if (row[field] === undefined || row[field] === null || String(row[field]).trim() === '') throw failure(`Please enter ${field}`);
  });
  ['quantity', 'price', 'weight'].forEach((field) => {
    if (row[field] !== undefined && (!Number.isFinite(Number(row[field])) || Number(row[field]) < 0)) throw failure(`${field} must be a non-negative number`);
  });
  Object.entries(relations).forEach(([field, target]) => {
    if (row[field] && !db[target].some((r) => r.id === row[field] && (r.client === row.client || (field === 'createdBy' && r.id === DEMO_USER.id)))) throw failure(`Please select a valid ${field}`);
  });
  if (row.lease && row.company && db.leases.find((r) => r.id === row.lease)?.company !== row.company) throw failure('Lease must belong to the selected company');
  if (row.well && row.lease && db.wells.find((r) => r.id === row.well)?.lease !== row.lease) throw failure('Well must belong to the selected lease');
  const unique = collection === 'clients' ? 'code' : collection === 'users' ? 'email' : collection === 'warehouses' ? 'warehousenumber' : null;
  if (unique && db[collection].some((r) => r.id !== row.id && (collection === 'clients' || r.client === row.client) && String(r[unique]).toLowerCase() === String(row[unique]).toLowerCase())) throw failure(`${unique} already exists`, 409);
  if (collection === 'clients' && previous && row.code !== previous.code) throw failure('Client code cannot be changed');
  if (collection === 'users' && !['user', 'admin', 'superadmin'].includes(row.role)) throw failure('Please select a valid role');
  if (row.id === DEMO_USER.id && (row.role !== DEMO_USER.role || row.status !== DEMO_USER.status)) throw failure('The demo superuser must stay active with full access');
  if (row.date && Number.isNaN(new Date(row.date).getTime())) throw failure('Please enter a valid date');
}

// No fetch fallback: every demo request stays in this browser, including errors.
export async function demoRequest(method, path, body, clientOverride) {
  const url = new URL(path, 'http://demo.local');
  const [, apiPrefix, collection, id, action] = url.pathname.replace(/\/$/, '').split('/');
  const db = getDatabase();
  const client = clientOverride || DEMO_USER.client;
  const params = url.searchParams;
  if (apiPrefix !== 'api') throw failure('Unknown demo endpoint', 404);

  if (collection === 'auth') {
    if (method === 'GET' && id === 'me') return { user: copy(DEMO_USER) };
    if (method === 'POST' && ['login', 'register', 'refresh-token'].includes(id)) return { accessToken: DEMO_TOKEN, user: copy(DEMO_USER) };
    if (method === 'POST' && id === 'logout') return { message: 'Signed out of demo' };
    throw failure('Account recovery is simulated in demo mode; no email is sent.');
  }
  if (collection !== 'clients' && !db.clients.some((c) => c.id === client && c.status === 'active')) throw failure('Please select an active demo client');
  if (collection === 'reports' && method === 'GET') return copy(report(id, params, client));
  if (!Array.isArray(db[collection])) throw failure(`Unknown demo endpoint: ${path}`, 404);

  const scoped = db[collection].filter((row) => collection === 'clients' || row.client === client);
  const existing = id ? scoped.find((row) => row.id === id) : null;
  if (id && !existing) throw failure('Record not found', 404);

  if (method === 'GET' && !action) {
    if (id) return copy(populate(existing));
    let rows = scoped.filter((row) => Array.from(params.entries()).every(([key, value]) => {
      if (['page', 'limit'].includes(key)) return true;
      if (key === 'q') return `${row.name || ''} ${row.code || ''}`.toLowerCase().includes(value.toLowerCase());
      return String(row[key]) === value;
    }));
    rows = [...rows].sort((a, b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || '')));
    const totalItems = rows.length;
    const page = Math.max(1, Number(params.get('page')) || 1);
    const limit = Math.max(1, Number(params.get('limit')) || 100);
    return copy({ data: rows.slice((page - 1) * limit, page * limit).map(populate), totalItems, totalPages: Math.ceil(totalItems / limit), page });
  }
  if (collection === 'users' && action === 'reset-password' && method === 'POST') {
    return { message: 'Demo reset code: 000000. No email was sent.' };
  }
  if (action === 'deactivate' && method === 'PATCH' && ['clients', 'users'].includes(collection)) {
    if ([DEMO_USER.id, DEMO_USER.client, client].includes(existing.id)) throw failure('The current demo user and client must stay active');
    existing.status = 'inactive';
    persist();
    return copy(existing);
  }
  if (action) throw failure('Unknown demo action', 404);

  if (method === 'POST' && !id) {
    const fields = cleanBody(body);
    const row = { status: 'active', ...(collection === 'users' ? { role: 'user' } : {}), ...fields, id: `demo-${collection}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, client, createdAt: new Date().toISOString() };
    if (collection === 'clients') row.code = String(row.code || '').trim().toUpperCase();
    if (['deliveries', 'shipping-papers'].includes(collection)) {
      row.date = row.date || new Date().toISOString();
      row.createdBy = row.createdBy || DEMO_USER.id;
      row.active = Number(row.active) || 0;
      const prefix = collection === 'deliveries' ? 'D' : 'SP';
      row.datanumber = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }
    validate(collection, row);
    db[collection].push(row);
    persist();
    return copy(populate(row));
  }
  if (id && ['PUT', 'PATCH'].includes(method)) {
    const row = { ...existing, ...cleanBody(body), updatedAt: new Date().toISOString() };
    if ([DEMO_USER.client, client].includes(row.id) && row.status !== 'active') throw failure('The current demo client must stay active');
    validate(collection, row, existing);
    Object.assign(existing, row);
    persist();
    return copy(populate(existing));
  }
  if (id && method === 'DELETE') {
    const references = Object.entries(relations).filter(([, target]) => target === collection).map(([field]) => field);
    const children = collection === 'deliveries' ? 'delivery-chemicals' : collection === 'shipping-papers' ? 'shipping-chemicals' : null;
    if (Object.entries(db).some(([key, rows]) => key !== children && rows.some((row) => row.client === client && references.some((field) => row[field] === id)))) throw failure('Remove related records before deleting this record', 409);
    db[collection] = db[collection].filter((row) => row.id !== id);
    if (children) db[children] = db[children].filter((row) => row[collection === 'deliveries' ? 'delivery' : 'shippingPaper'] !== id);
    persist();
    return { message: 'Record deleted' };
  }
  throw failure(`Unsupported demo request: ${method} ${path}`, 404);
}
