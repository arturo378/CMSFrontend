import React from 'react';
import ResourcePage from '../components/ResourcePage';
import { useHistory } from 'react-router-dom';
import { paths, linkTo } from '../config/routes';

import { useGetCompaniesQuery, useAddCompanyMutation, useUpdateCompanyMutation, useDeleteCompanyMutation } from '../store/api/companiesApi';
const fields = [
  { name: 'name', label: 'Company name', required: true, wide: true },
  { name: 'city', label: 'City', required: true }, { name: 'state', label: 'State', required: true },
  { name: 'zip', label: 'ZIP code' }, { name: 'phone', label: 'Phone number', type: 'tel' },
];
const columns = fields.map(field => ({ title: field.label, field: field.name }));
export default function LocationManagement() {
  const history = useHistory();
  const query = useGetCompaniesQuery({ limit: 100 });
  const [add] = useAddCompanyMutation(); const [update] = useUpdateCompanyMutation(); const [remove] = useDeleteCompanyMutation();
  return <ResourcePage title="Locations" query={query} columns={columns} fields={fields} createLabel="Add company"
    onSave={(values, row) => (row ? update({ ...values, id: row.id }) : add(values)).unwrap()}
    onDelete={row => remove(row.id).unwrap()}
    rowActions={[
      { label: 'View leases', onClick: row => history.push(linkTo(paths.leases, { companyId: row.id })) },
      { label: 'Pricing', onClick: row => history.push(linkTo(paths.pricing, { companyId: row.id })) },
    ]} />;
}
