import { readTablePreferences } from './tablePreferences';
import { parseDay, presetRange, filterByDate } from './useDateRange';
import { parseGps } from './mapCoordinates';
import { navigationRoute, paths } from './routes';

test('shareable table state overrides saved preferences and invalid page values are clamped', () => {
  expect(readTablePreferences('?q=North&page=-10&pageSize=999&dense=false', { search: 'Old', page: 4, pageSize: 20, dense: true }))
    .toMatchObject({ search: 'North', page: 0, pageSize: 10, dense: false });
  expect(readTablePreferences('?page=3&pageSize=25&sort=name&direction=desc')).toMatchObject({ page: 2, pageSize: 25, sort: 'name', direction: 'desc' });
});

test('report date ranges include both boundary days and reject malformed calendar dates', () => {
  expect(parseDay('2026-02-30')).toBeNull();
  expect(presetRange('last7', new Date(2026, 10, 12))).toEqual({ from: '2026-11-06', to: '2026-11-12' });
  const rows = [
    { id: 1, date: new Date(2026, 10, 6, 0, 0, 0).toISOString() },
    { id: 2, date: new Date(2026, 10, 12, 23, 59, 59).toISOString() },
    { id: 3, date: new Date(2026, 10, 13, 0, 0, 0).toISOString() },
  ];
  expect(filterByDate(rows, '2026-11-06', '2026-11-12').map(row => row.id)).toEqual([1, 2]);
  expect(filterByDate(rows, '2026-11-12', '2026-11-06')).toEqual([]);
});

test('GPS parsing accepts valid coordinates and rejects out-of-range or partial values', () => {
  expect(parseGps('31.5, -99.1')).toEqual({ lat: 31.5, lng: -99.1 });
  ['91, 0', '0, 181', '31degrees, -99', ', 12', '1, 2, 3'].forEach(value => expect(parseGps(value)).toBeNull());
});

test('nested and legacy child routes retain the correct sidebar and client-switch destination', () => {
  expect(navigationRoute(paths.wells).path).toBe(paths.locations);
  expect(navigationRoute(paths.pricing).path).toBe(paths.locations);
  expect(navigationRoute(paths.inventory).path).toBe(paths.warehouses);
  expect(navigationRoute(paths.shippingChemicals).path).toBe(paths.shipping);
  expect(navigationRoute(paths.deliveryChemicals).path).toBe(paths.deliveries);
});
