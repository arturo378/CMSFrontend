import React from 'react';
import { batch, useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Typography, TextField, MenuItem, Button } from '@material-ui/core';
import { useAuth } from '../config/AuthContext';
import { useGetClientsQuery } from '../store/api/clientsApi';
import { baseApi } from '../store/api/baseApi';
import { setActiveClient, clearActiveClient, selectActiveClientId } from '../store/slices/clientContextSlice';
import { resetFilters } from '../store/slices/dashboardFiltersSlice';
import { clearToasts } from '../store/slices/uiSlice';
import { useConfirmation } from './ConfirmationProvider';
import { navigationRoute } from '../config/routes';
export default function ClientSwitcher() {
  const { user, isSuperAdmin } = useAuth(); const dispatch = useDispatch(); const history = useHistory(); const { discard, saving } = useConfirmation();
  const activeClientId = useSelector(selectActiveClientId);
  const location = useLocation();
  const query = useGetClientsQuery({ status: 'active', limit: 100 }, { skip: !isSuperAdmin });
  const clients = query.currentData?.data || [];
  if (!isSuperAdmin) return <Typography variant="caption" color="textSecondary">{user?.clientId?.name || 'My client'}</Typography>;
  const change = async event => {
    const id = event.target.value || null;
    if (id === (activeClientId || null) || !(await discard())) return;
    const client = clients.find(item => item.id === id);
    const destination = navigationRoute(location.pathname);
    batch(() => {
      dispatch(baseApi.util.resetApiState());
      dispatch(resetFilters()); dispatch(clearToasts());
      dispatch(id ? setActiveClient({ id, name: client?.name }) : clearActiveClient());
      history.replace(destination?.path || '/');
    });
  };
  return <div className="client-switcher">
    <TextField id="client-workspace" select label="Client workspace" size="small" value={activeClientId || ''} onChange={change} disabled={saving} style={{ width: 190, maxWidth: '100%' }}>
      <MenuItem value="">My client</MenuItem>
      {activeClientId && !clients.some(client => client.id === activeClientId) && <MenuItem value={activeClientId} disabled>{query.isFetching ? 'Loading client…' : 'Selected client unavailable'}</MenuItem>}
      {clients.map(client => <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>)}
    </TextField>
    {query.error && <Button size="small" onClick={query.refetch}>Retry clients</Button>}
  </div>;
}
