import { DEMO_USER } from '../config/demoMode';

const products = [
  ['CorroShield X200', 'UN1760', 450, 12.5],
  ['ScaleGuard Pro', 'UN3267', 220, 8.75],
  ['BiocidePlus 500', 'UN2734', 180, 15],
  ['DemulsiFlo 300', 'UN1993', 310, 11],
];

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(9, 0, 0, 0);
  return new Date(Math.min(date.getTime(), Date.now())).toISOString();
}

// Store foreign keys as IDs, just as the API does before populating responses.
export function createDemoDatabase() {
  const db = Object.fromEntries([
    'clients', 'users', 'companies', 'leases', 'wells', 'warehouses',
    'chemicals', 'pricing', 'warehouse-chemicals', 'deliveries',
    'delivery-chemicals', 'shipping-papers', 'shipping-chemicals',
  ].map((key) => [key, []]));

  db.clients = [
    { id: 'demo-client-permian', name: 'Permian Chemical Services', code: 'PERMIAN', city: 'Midland', state: 'TX', zip: '79701', phone: '432-555-0100', contactEmail: 'permian@example.com', status: 'active', notes: 'Sample West Texas operation' },
    { id: 'demo-client-eagle', name: 'Eagle Ford Chemical Services', code: 'EAGLE', city: 'San Antonio', state: 'TX', zip: '78201', phone: '210-555-0100', contactEmail: 'eagle@example.com', status: 'active', notes: 'Sample South Texas operation' },
  ];

  db.clients.forEach((client, clientIndex) => {
    const prefix = clientIndex === 0 ? 'permian' : 'eagle';
    const record = (id, fields) => ({ id: `${prefix}-${id}`, client: client.id, createdAt: daysAgo(35), ...fields });
    const gps = clientIndex === 0 ? ['31.9973,-102.0779', '32.0200,-102.1100'] : ['28.8883,-98.5464', '28.9300,-98.4900'];
    const admin = clientIndex === 0 ? { ...DEMO_USER } : record('admin', { username: 'eagle.admin', fullname: 'Jordan Lee', name: 'Jordan Lee', email: 'jordan@example.com', role: 'admin', status: 'active' });
    const driver = record('driver', { username: `${prefix}.driver`, fullname: clientIndex === 0 ? 'Alex Morgan' : 'Sam Rivera', name: clientIndex === 0 ? 'Alex Morgan' : 'Sam Rivera', email: `${prefix}.driver@example.com`, role: 'user', status: 'active' });
    db.users.push(admin, driver);

    for (let i = 0; i < 2; i += 1) {
      const company = record(`company-${i}`, { name: [`${clientIndex === 0 ? 'Permian Basin' : 'Eagle Ford'} Oil Co.`, `${clientIndex === 0 ? 'West Texas' : 'South Texas'} Energy LLC`][i], city: client.city, state: client.state, zip: client.zip, phone: client.phone });
      const lease = record(`lease-${i}`, { name: i === 0 ? 'North Pad Alpha' : 'South Pad Beta', company: company.id });
      const warehouse = record(`warehouse-${i}`, { name: `${client.city} ${i === 0 ? 'Central' : 'South'}`, warehousenumber: `WH-${clientIndex + 1}0${i + 1}`, areamanager: admin.fullname });
      db.companies.push(company);
      db.leases.push(lease);
      db.warehouses.push(warehouse);
      for (let w = 0; w < 2; w += 1) {
        db.wells.push(record(`well-${i}-${w}`, { name: `Well ${i + 1}-${w === 0 ? 'A' : 'B'}`, company: company.id, lease: lease.id, gps: gps[i], description: w === 0 ? 'Primary production well' : 'Secondary production well', active: 1 }));
      }
    }

    products.forEach(([tradename, dottag, weight, price], i) => {
      const chemical = record(`chemical-${i}`, { tradename, dottag, weight });
      db.chemicals.push(chemical);
      for (let c = 0; c < 2; c += 1) {
        db.pricing.push(record(`price-${c}-${i}`, { company: `${prefix}-company-${c}`, chemical: chemical.id, price: price + c }));
        db['warehouse-chemicals'].push(record(`stock-${c}-${i}`, { warehouse: `${prefix}-warehouse-${c}`, chemical: chemical.id, quantity: 600 + i * 150 + c * 100 }));
      }
    });

    for (let i = 0; i < 36; i += 1) {
      const c = i % 2;
      const delivery = record(`delivery-${i}`, { datanumber: `D-${clientIndex + 1}${String(i + 1).padStart(3, '0')}`, date: daysAgo(i), company: `${prefix}-company-${c}`, lease: `${prefix}-lease-${c}`, well: `${prefix}-well-${c}-${i % 3 === 0 ? 1 : 0}`, gps: gps[c], comments: ['Routine corrosion treatment', 'Scheduled scale treatment', 'Production maintenance'][i % 3], createdBy: i % 2 === 0 ? admin.id : driver.id, invoicenum: `INV-${clientIndex + 1}${1000 + i}`, active: i % 5 === 0 ? 0 : 1 });
      db.deliveries.push(delivery);
      for (let j = 0; j < 2; j += 1) {
        db['delivery-chemicals'].push(record(`delivery-chemical-${i}-${j}`, { delivery: delivery.id, chemical: `${prefix}-chemical-${(i + j) % 4}`, quantity: 20 + (i % 6) * 10 + j * 5 }));
      }
    }

    for (let i = 0; i < 8; i += 1) {
      const paper = record(`shipping-${i}`, { datanumber: `SP-${clientIndex + 1}${String(i + 1).padStart(3, '0')}`, date: daysAgo(i * 3), createdBy: i % 2 === 0 ? admin.id : driver.id, originwarehousenumber: `WH-${clientIndex + 1}01`, destinationwarehousenumber: `WH-${clientIndex + 1}02`, trucknumber: `TK-${101 + i}`, comments: 'Warehouse replenishment transfer', gps: gps[0], active: i % 3 === 0 ? 0 : 1 });
      db['shipping-papers'].push(paper);
      db['shipping-chemicals'].push(record(`shipping-chemical-${i}`, { shippingPaper: paper.id, chemical: `${prefix}-chemical-${i % 4}`, quantity: 40 + i * 5 }));
    }
  });

  return db;
}
