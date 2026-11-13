import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip } from '@material-ui/core';
import ResourcePage from '../components/ResourcePage';
import QueryState from '../components/QueryState';
import { useConfirmation } from '../components/ConfirmationProvider';
import { useGetClientsQuery, useGetClientQuery, useAddClientMutation, useUpdateClientMutation, useDeactivateClientMutation } from '../store/api/clientsApi';
export default function ClientManagement() {
  const query = useGetClientsQuery({ limit: 100 }); const { confirm } = useConfirmation();
  const [add] = useAddClientMutation(); const [update] = useUpdateClientMutation(); const [deactivate] = useDeactivateClientMutation();
  const [viewingId, setViewingId] = useState(null); const detail = useGetClientQuery(viewingId, { skip: !viewingId });
  const fields = row => [
    { name: 'name', label: 'Client name', required: true },
    { name: 'code', label: 'Client code', required: true, disabled: Boolean(row), omit: Boolean(row), helperText: '2–32 letters, numbers, or hyphens. Permanent once created.', validate: value => /^[A-Za-z0-9][A-Za-z0-9-]{1,31}$/.test(value) ? '' : 'Enter a valid client code.' },
    { name: 'contactEmail', label: 'Contact email', type: 'email' }, { name: 'phone', label: 'Phone', type: 'tel' }, { name: 'city', label: 'City' }, { name: 'state', label: 'State' }, { name: 'zip', label: 'ZIP code' }, { name: 'notes', label: 'Notes', multiline: true },
  ];
  return <>
    <ResourcePage title="Clients" query={query} fields={fields} createLabel="Add client" columns={[
      { title: 'Name', field: 'name' }, { title: 'Code', field: 'code' }, { title: 'Status', field: 'status', render: row => <Chip size="small" variant="outlined" label={row.status === 'active' ? 'Active' : 'Inactive'} /> }, { title: 'Contact email', field: 'contactEmail' }, { title: 'City', field: 'city' },
    ]} onSave={(values, row) => {
      const payload = { ...values }; if (!payload.contactEmail) delete payload.contactEmail;
      return (row ? update({ ...payload, id: row.id }) : add(payload)).unwrap();
    }} rowActions={[
      { label: 'View details', onClick: row => setViewingId(row.id) },
      row => ({ label: row.status === 'active' ? 'Deactivate' : 'Reactivate', onClick: async selected => {
        const active = selected.status === 'active';
        if (await confirm({ title: (active ? 'Deactivate ' : 'Reactivate ') + selected.name + '?', message: active ? 'All users in this client will be signed out and unable to sign in.' : 'Users in this client will be able to sign in again.', confirmLabel: active ? 'Deactivate client' : 'Reactivate client', danger: active })) await (active ? deactivate(selected.id) : update({ id: selected.id, status: 'active' })).unwrap();
      } }),
    ]} />
    <Dialog open={Boolean(viewingId)} onClose={() => setViewingId(null)} fullWidth maxWidth="sm" aria-labelledby="client-detail-title">
      <DialogTitle id="client-detail-title">{detail.currentData?.name || 'Client details'}</DialogTitle>
      <DialogContent>{detail.error ? <QueryState error={detail.error} onRetry={detail.refetch} /> : !detail.currentData ? <QueryState loading /> : <div className="record-form">{Object.entries(detail.currentData.counts || {}).map(([label, value]) => <div key={label}><Typography color="textSecondary">{label}</Typography><Typography variant="h5">{value}</Typography></div>)}<Typography className="form-wide" variant="body2">{detail.currentData.notes}</Typography></div>}</DialogContent>
      <DialogActions><Button onClick={() => setViewingId(null)}>Close</Button></DialogActions>
    </Dialog>
  </>;
}
