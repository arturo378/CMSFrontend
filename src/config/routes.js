export const paths = {
  locations: '/locationmanagment', leases: '/locationmanagment/leasemanagment',
  wells: '/locationmanagment/leasemanagment/wellmanagment', pricing: '/pricing',
  warehouses: '/warehousemanagement', inventory: '/warehousechemical',
  shipping: '/shippingpapers', shippingChemicals: '/shippingchemicals',
  deliveries: '/delivery', deliveryChemicals: '/delivery/editdelivery',
};
export const routes = [
  { path: '/', title: 'Dashboard', group: 'Overview', description: 'Your operations at a glance.' },
  { path: '/usermanagement', title: 'Users', group: 'Administration', description: 'Manage your team and their access.' },
  { path: paths.locations, title: 'Locations', group: 'Administration', description: 'Manage companies, their leases, wells, and pricing.' },
  { path: paths.leases, title: 'Leases', group: 'Administration', parent: paths.locations },
  { path: paths.wells, title: 'Wells', group: 'Administration', parent: paths.leases },
  { path: paths.warehouses, title: 'Warehouses', group: 'Administration', description: 'Organize warehouses and their product inventory.' },
  { path: paths.inventory, title: 'Warehouse inventory', group: 'Administration', parent: paths.warehouses },
  { path: '/chemicalmanagement', title: 'Products', group: 'Administration', description: 'Your chemical and product catalog.' },
  { path: paths.pricing, title: 'Pricing', group: 'Administration', parent: paths.locations },
  { path: '/clientmanagement', title: 'Clients', group: 'Platform', description: 'Manage client organizations and their status.' },
  { path: paths.shipping, title: 'Shipping papers', group: 'Work orders', description: 'Track warehouse transfers and their chemical line items.' },
  { path: paths.shippingChemicals, title: 'Shipping chemicals', group: 'Work orders', parent: paths.shipping },
  { path: paths.deliveries, title: 'Deliveries', group: 'Work orders', description: 'Track deliveries to companies, leases, and wells.' },
  { path: paths.deliveryChemicals, title: 'Delivery chemicals', group: 'Work orders', parent: paths.deliveries },
  { path: '/weeklyearnings', title: 'Earnings report', group: 'Reports', description: 'Review earnings by company and date range.' },
  { path: '/warehouseInventory', title: 'Inventory levels', group: 'Reports', description: 'Review quantities available at each warehouse.' },
  { path: '/userReport', title: 'User activity', group: 'Reports', description: 'Review delivery and shipping activity.' },
];
export const routeFor = pathname => routes.find(r => r.path === (pathname.replace(/\/$/, '') || '/'));
export function navigationRoute(pathname) {
  let route = routeFor(pathname);
  while (route?.parent) route = routeFor(route.parent);
  return route;
}
export const recordId = value => typeof value === 'object' && value ? String(value.id || value._id || '') : String(value || '');
export function linkTo(path, values = {}) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') params.set(key, value); });
  return path + (params.toString() ? `?${params}` : '');
}
