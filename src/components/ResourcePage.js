import React, { useState } from 'react';
import { Button, LinearProgress } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { useDispatch } from 'react-redux';
import MaterialTable from '../config/MaterialTable';
import { showToast } from '../store/slices/uiSlice';
import PageTitle from './PageTitle';
import QueryState from './QueryState';
import RecordForm from './RecordForm';
import { useConfirmation } from './ConfirmationProvider';

export default function ResourcePage({ title, description, breadcrumbs, query, columns, fields, onSave, onDelete, createLabel, rowActions = [], canEdit = true, children, actions, onRowClick }) {
  const [editing, setEditing] = useState(undefined);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const dispatch = useDispatch();
  const { confirm } = useConfirmation();
  const rows = query.currentData?.data || [];
  const remove = async row => {
    if (busyId || !(await confirm({ title: 'Delete ' + (row.name || row.tradename || row.datanumber || row.chemical?.tradename || 'record') + '?', message: 'This permanently removes the record. You cannot undo this from the platform.', confirmLabel: 'Delete record', danger: true }))) return;
    setBusyId(row.id); setActionError('');
    try { await onDelete(row); dispatch(showToast({ message: 'Record deleted', severity: 'success' })); }
    catch (error) { setActionError(error?.message || 'Unable to delete this record. Please try again.'); }
    finally { setBusyId(null); }
  };
  const resolveAction = action => ({ ...action, icon: action.icon || 'arrow_forward', tooltip: action.label, onClick: (event, row) => action.onClick(row) });
  const tableActions = rowActions.map(action => typeof action === 'function' ? row => resolveAction(action(row)) : resolveAction(action));
  if (canEdit && onSave) tableActions.push({ icon: 'edit', tooltip: 'Edit', onClick: (event, row) => setEditing(row) });
  if (canEdit && onDelete) tableActions.push(row => ({ icon: 'delete', tooltip: busyId === row.id ? 'Deleting…' : 'Delete', disabled: Boolean(busyId), onClick: (event, selected) => remove(selected) }));
  return <div>
    <PageTitle description={description} breadcrumbs={breadcrumbs} actions={<>{actions}{canEdit && onSave && <Button startIcon={<AddIcon />} variant="contained" color="primary" onClick={() => setEditing(null)}>{createLabel || 'Add record'}</Button>}</>}>{title}</PageTitle>
    {children}
    {actionError && <div className="form-error" role="alert">{actionError}</div>}
    {query.error && query.currentData && <div className="form-error" role="alert">Unable to refresh. Showing previously loaded records. <Button onClick={query.refetch}>Try again</Button></div>}
    {!query.currentData ? (query.error ? <QueryState error={query.error} onRetry={query.refetch} /> : <QueryState loading />) : <>
      {query.isFetching && <LinearProgress aria-label="Refreshing records" />}
      <MaterialTable columns={columns} data={rows} actions={tableActions} onRowClick={onRowClick} localization={{ body: { emptyDataSourceMessage: canEdit && onSave ? 'No records yet. Use the add button above to get started.' : 'No records to display.' } }} />
    </>}
    {editing !== undefined && <RecordForm title={editing ? 'Edit ' + title.toLowerCase().replace(/s$/, '') : createLabel || 'Add record'} fields={typeof fields === 'function' ? fields(editing) : fields} record={editing} onClose={() => setEditing(undefined)} saveLabel={editing ? 'Save changes' : createLabel || 'Create record'} onSave={async (values, original) => {
      await onSave(values, original);
      dispatch(showToast({ message: original ? 'Changes saved' : 'Record created', severity: 'success' }));
    }} />}
  </div>;
}
