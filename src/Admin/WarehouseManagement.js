import React from 'react';
import ResourcePage from '../components/ResourcePage';
import { useHistory } from 'react-router-dom';
import { paths, linkTo } from '../config/routes';

import { useGetWarehousesQuery, useAddWarehouseMutation, useUpdateWarehouseMutation, useDeleteWarehouseMutation } from '../store/api/warehousesApi';
const fields = [{ name: 'name', label: 'Warehouse name', required: true, wide: true }, { name: 'warehousenumber', label: 'Warehouse number', required: true }, { name: 'areamanager', label: 'Area manager', required: true }];
export default function WarehouseManagement() {
  const history = useHistory(); const query = useGetWarehousesQuery({ limit: 100 });
  const [add] = useAddWarehouseMutation(); const [update] = useUpdateWarehouseMutation(); const [remove] = useDeleteWarehouseMutation();
  return <ResourcePage title="Warehouses" query={query} fields={fields} columns={fields.map(field => ({ title: field.label, field: field.name }))} createLabel="Add warehouse"
    onSave={(values, row) => (row ? update({ ...values, id: row.id }) : add(values)).unwrap()}
    onDelete={row => remove(row.id).unwrap()}
    rowActions={[{ label: 'View inventory', onClick: row => history.push(linkTo(paths.inventory, { warehouseId: row.id })) }]} />;
}
