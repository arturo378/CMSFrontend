import React from 'react';
import ResourcePage from '../components/ResourcePage';
import { useGetChemicalsQuery, useAddChemicalMutation, useUpdateChemicalMutation, useDeleteChemicalMutation } from '../store/api/chemicalsApi';
const fields = [{ name: 'tradename', label: 'Trade name', required: true, wide: true }, { name: 'dottag', label: 'DOT tag', required: true }, { name: 'weight', label: 'Weight', type: 'number', required: true }];
export default function ChemicalManagement() {
  const query = useGetChemicalsQuery({ limit: 100 });
  const [add] = useAddChemicalMutation(); const [update] = useUpdateChemicalMutation(); const [remove] = useDeleteChemicalMutation();
  return <ResourcePage title="Products" query={query} fields={fields} columns={fields.map(field => ({ title: field.label, field: field.name, type: field.type === 'number' ? 'numeric' : 'string' }))} createLabel="Add product"
    onSave={(values, row) => (row ? update({ ...values, id: row.id }) : add(values)).unwrap()} onDelete={row => remove(row.id).unwrap()} />;
}
