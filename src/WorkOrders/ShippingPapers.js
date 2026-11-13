import React, { useState } from 'react';
import { Chip, TextField, MenuItem } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import ResourcePage from '../components/ResourcePage';
import MapDialog from '../components/MapDialog';
import { parseGps } from '../config/mapCoordinates';
import { useAuth } from '../config/AuthContext';
import { paths, linkTo } from '../config/routes';
import useQueryValue from '../config/useQueryValue';
import { useLocation } from 'react-router-dom';
import { filterByDate } from '../config/useDateRange';
import { useGetShippingPapersQuery, useAddShippingPaperMutation, useUpdateShippingPaperMutation, useDeleteShippingPaperMutation } from '../store/api/shippingPapersApi';
const fields = [
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'trucknumber', label: 'Truck number', required: true },
  { name: 'originwarehousenumber', label: 'Origin warehouse number', required: true },
  { name: 'destinationwarehousenumber', label: 'Destination warehouse number', required: true },
  { name: 'gps', label: 'GPS coordinates', helperText: 'Latitude, longitude' },
  { name: 'active', label: 'Status', type: 'select', defaultValue: 1, options: [{ value: 0, label: 'Not completed' }, { value: 1, label: 'Completed' }] },
  { name: 'comments', label: 'Comments', multiline: true },
];
export default function ShippingPapers() {
  const history = useHistory(); const { isAdmin } = useAuth(); const [position, setPosition] = useState(null);
  const [filter, setFilter] = useQueryValue('active'); const active = ['0', '1'].includes(filter) ? filter : '';
  const query = useGetShippingPapersQuery({ limit: 100, active: active === '' ? undefined : active });
  const dateParams = new URLSearchParams(useLocation().search);
  const from = dateParams.get('from'); const to = dateParams.get('to');
  const visibleQuery = from || to ? { ...query, currentData: query.currentData ? { ...query.currentData, data: filterByDate(query.currentData.data, from, to) } : undefined } : query;
  const [add] = useAddShippingPaperMutation(); const [update] = useUpdateShippingPaperMutation(); const [remove] = useDeleteShippingPaperMutation();
  const showMap = row => { const point = parseGps(row.gps); if (!point) throw new Error('No valid GPS coordinates are available for this record.'); setPosition(point); };
  return <>
    <ResourcePage title="Shipping papers" query={visibleQuery} fields={fields} canEdit={isAdmin} createLabel="Add shipping paper" columns={[
      { title: 'Data number', field: 'datanumber' }, { title: 'Date', field: 'date', render: row => row.date ? new Date(row.date).toLocaleDateString() : '—' },
      { title: 'Origin', field: 'originwarehousenumber' }, { title: 'Destination', field: 'destinationwarehousenumber' }, { title: 'Truck', field: 'trucknumber' },
      { title: 'Created by', field: 'createdBy.fullname', render: row => row.createdBy?.fullname || row.createdBy?.username || row.createdBy?.name || '—' },
      { title: 'Status', field: 'active', lookup: { 0: 'Not completed', 1: 'Completed' }, render: row => <Chip size="small" label={Number(row.active) === 1 ? 'Completed' : 'Not completed'} variant="outlined" /> },
    ]} onSave={(values, row) => (row ? update({ ...values, id: row.id, active: Number(values.active) }) : add({ ...values, active: Number(values.active) })).unwrap()}
      onDelete={row => remove(row.id).unwrap()} rowActions={[
        { label: 'View chemicals', onClick: row => history.push(linkTo(paths.shippingChemicals, { shippingPaperId: row.id })) },
        { label: 'View map', onClick: showMap },
      ]}>
      <div className="filter-bar">{(from || to) && <span className="context-banner">Dates: {from || 'All'} to {to || 'All'}</span>}<TextField id="shipping-status" select label="Status" value={active} onChange={event => setFilter(event.target.value)} size="small" style={{ minWidth: 180 }}><MenuItem value="">All statuses</MenuItem><MenuItem value="0">Not completed</MenuItem><MenuItem value="1">Completed</MenuItem></TextField></div>
    </ResourcePage>
    <MapDialog position={position} onClose={() => setPosition(null)} />
  </>;
}
