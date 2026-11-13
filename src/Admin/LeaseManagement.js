import React from 'react';
import ResourcePage from '../components/ResourcePage';
import { useHistory } from 'react-router-dom';
import { paths, linkTo } from '../config/routes';

import RecordContext from '../components/RecordContext';
import { useGetLeasesQuery, useAddLeaseMutation, useUpdateLeaseMutation, useDeleteLeaseMutation } from '../store/api/leasesApi';
const fields = [{ name: 'name', label: 'Lease name', required: true, wide: true }];
function Leases({ company }) {
  const history = useHistory(); const query = useGetLeasesQuery({ company: company.id, limit: 100 });
  const [add] = useAddLeaseMutation(); const [update] = useUpdateLeaseMutation(); const [remove] = useDeleteLeaseMutation();
  return <ResourcePage title="Leases" description={'Manage leases for ' + company.name + '.'}
    breadcrumbs={[{ label: 'Locations', to: paths.locations }, { label: company.name }]}
    query={query} fields={fields} columns={[{ title: 'Lease name', field: 'name' }]} createLabel="Add lease"
    onSave={(values, row) => (row ? update({ ...values, company: company.id, id: row.id }) : add({ ...values, company: company.id })).unwrap()}
    onDelete={row => remove(row.id).unwrap()}
    rowActions={[{ label: 'View wells', onClick: row => history.push(linkTo(paths.wells, { companyId: company.id, leaseId: row.id })) }]} />;
}
export default function LeaseManagement() {
  return <RecordContext resource="companies" param="companyId" back={paths.locations} backLabel="Choose a company">{company => <Leases key={company.id} company={company} />}</RecordContext>;
}
