import React from 'react';
import { useLocation } from 'react-router-dom';
import ResourcePage from '../components/ResourcePage';
import RecordContext from '../components/RecordContext';
import QueryState from '../components/QueryState';
import { paths, linkTo, recordId } from '../config/routes';
import { useGetWellsQuery, useAddWellMutation, useUpdateWellMutation, useDeleteWellMutation } from '../store/api/wellsApi';
const fields = [{ name: 'name', label: 'Well name', required: true, wide: true }, { name: 'gps', label: 'GPS coordinates', helperText: 'Latitude, longitude', wide: true }, { name: 'description', label: 'Description', multiline: true }];
function Wells({ lease }) {
  const location = useLocation();
  const companyId = recordId(lease.company);
  const requestedCompany = new URLSearchParams(location.search).get('companyId');
  const valid = companyId && (!requestedCompany || companyId === requestedCompany);
  const query = useGetWellsQuery({ lease: lease.id, company: companyId, limit: 100 }, { skip: !valid });
  const [add] = useAddWellMutation(); const [update] = useUpdateWellMutation(); const [remove] = useDeleteWellMutation();
  if (!valid) return <QueryState title="The selected company and lease do not match" description="Choose the lease again from its company." to={paths.locations} actionLabel="Choose a company" />;
  return <ResourcePage title="Wells" description={'Manage wells for ' + lease.name + '.'}
    breadcrumbs={[{ label: 'Locations', to: paths.locations }, { label: lease.company?.name || 'Company', to: linkTo(paths.leases, { companyId }) }, { label: lease.name }]}
    query={query} fields={fields} columns={fields.map(field => ({ title: field.label, field: field.name }))} createLabel="Add well"
    onSave={(values, row) => (row ? update({ ...values, lease: lease.id, company: companyId, id: row.id }) : add({ ...values, lease: lease.id, company: companyId })).unwrap()}
    onDelete={row => remove(row.id).unwrap()} />;
}
export default function WellManagement() {
  return <RecordContext resource="leases" param="leaseId" legacy="leaseid" back={paths.locations} backLabel="Choose a company">{lease => <Wells key={lease.id} lease={lease} />}</RecordContext>;
}
