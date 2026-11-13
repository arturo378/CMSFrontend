import React, { useState } from 'react';
import { Chip, TextField, MenuItem } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import ResourcePage from '../components/ResourcePage';
import QueryState from '../components/QueryState';
import RecordPicker from '../components/RecordPicker';
import MapDialog from '../components/MapDialog';
import { parseGps } from '../config/mapCoordinates';
import { useAuth } from '../config/AuthContext';
import { paths, linkTo, recordId } from '../config/routes';
import useQueryValue from '../config/useQueryValue';
import { useLocation } from 'react-router-dom';
import { filterByDate } from '../config/useDateRange';
import { useGetCompaniesQuery } from '../store/api/companiesApi';
import { useGetLeasesQuery } from '../store/api/leasesApi';
import { useGetWellsQuery } from '../store/api/wellsApi';
import { useGetDeliveriesQuery, useAddDeliveryMutation, useUpdateDeliveryMutation, useDeleteDeliveryMutation } from '../store/api/deliveriesApi';
const choices = rows => rows.map(row => ({ value: row.id, label: row.name }));
export default function Delivery() {
  const history = useHistory(); const { isAdmin } = useAuth(); const [position, setPosition] = useState(null);
  const [status, setStatus] = useQueryValue('active'); const active = ['0', '1'].includes(status) ? status : '';
  const [companyId, setCompanyId] = useQueryValue('companyId');
  const companies = useGetCompaniesQuery({ limit: 100 }); const leases = useGetLeasesQuery({ limit: 100 }); const wells = useGetWellsQuery({ limit: 100 });
  const query = useGetDeliveriesQuery({ limit: 100, company: companyId || undefined, active: active === '' ? undefined : active });
  const dateParams = new URLSearchParams(useLocation().search);
  const from = dateParams.get('from'); const to = dateParams.get('to');
  const visibleQuery = from || to ? { ...query, currentData: query.currentData ? { ...query.currentData, data: filterByDate(query.currentData.data, from, to) } : undefined } : query;
  const [add] = useAddDeliveryMutation(); const [update] = useUpdateDeliveryMutation(); const [remove] = useDeleteDeliveryMutation();
  const fields = [
    { name: 'date', label: 'Date', type: 'date', required: true }, { name: 'invoicenum', label: 'Invoice number', required: true },
    { name: 'company', label: 'Company', type: 'record', required: true, options: choices(companies.currentData?.data || []), resets: ['lease', 'well'], wide: true },
    { name: 'lease', label: 'Lease', type: 'record', required: true, options: values => choices((leases.currentData?.data || []).filter(row => recordId(row.company) === values.company)), disabled: values => !values.company, resets: ['well'] },
    { name: 'well', label: 'Well', type: 'record', required: true, options: values => choices((wells.currentData?.data || []).filter(row => recordId(row.lease) === values.lease && recordId(row.company) === values.company)), disabled: values => !values.lease },
    { name: 'gps', label: 'GPS coordinates', helperText: 'Latitude, longitude' },
    { name: 'active', label: 'Status', type: 'select', defaultValue: 0, options: [{ value: 0, label: 'Not completed' }, { value: 1, label: 'Completed' }] },
    { name: 'comments', label: 'Comments', multiline: true },
  ];
  const lookupError = companies.error || leases.error || wells.error;
  const showMap = row => { const point = parseGps(row.gps || row.well?.gps); if (!point) throw new Error('No valid GPS coordinates are available for this record.'); setPosition(point); };
  return <>
    <ResourcePage title="Deliveries" query={visibleQuery} fields={fields} canEdit={isAdmin && Boolean(companies.currentData && leases.currentData && wells.currentData) && !lookupError} createLabel="Add delivery" columns={[
      { title: 'Data number', field: 'datanumber' }, { title: 'Date', field: 'date', render: row => row.date ? new Date(row.date).toLocaleDateString() : '—' },
      { title: 'Company', field: 'company.name' }, { title: 'Lease', field: 'lease.name' }, { title: 'Well', field: 'well.name' }, { title: 'Invoice', field: 'invoicenum' },
      { title: 'Status', field: 'active', lookup: { 0: 'Not completed', 1: 'Completed' }, render: row => <Chip size="small" label={Number(row.active) === 1 ? 'Completed' : 'Not completed'} variant="outlined" /> },
    ]} onSave={(values, row) => (row ? update({ ...values, id: row.id, active: Number(values.active) }) : add({ ...values, active: Number(values.active) })).unwrap()}
      onDelete={row => remove(row.id).unwrap()} rowActions={[
        { label: 'View chemicals', onClick: row => history.push(linkTo(paths.deliveryChemicals, { deliveryId: row.id })) }, { label: 'View map', onClick: showMap },
      ]}>
      <div className="filter-bar">{(from || to) && <span className="context-banner">Dates: {from || 'All'} to {to || 'All'}</span>}<div style={{ width: 260, maxWidth: '100%' }}><RecordPicker id="delivery-company-filter" label="Company" value={companyId} options={choices(companies.currentData?.data || [])} onChange={setCompanyId} disabled={!companies.currentData} /></div><TextField id="delivery-status" select label="Status" value={active} onChange={event => setStatus(event.target.value)} size="small" style={{ minWidth: 180 }}><MenuItem value="">All statuses</MenuItem><MenuItem value="0">Not completed</MenuItem><MenuItem value="1">Completed</MenuItem></TextField></div>
      {lookupError && <QueryState error={lookupError} title="Unable to load form choices" onRetry={() => { companies.refetch(); leases.refetch(); wells.refetch(); }} />}
    </ResourcePage>
    <MapDialog position={position} onClose={() => setPosition(null)} />
  </>;
}
