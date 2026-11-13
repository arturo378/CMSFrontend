import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { selectToasts, dismissToast } from '../store/slices/uiSlice';
const colors = { success: '#166534', error: '#b91c1c', warning: '#92400e', info: '#1e40af' };
export default function ToastProvider() {
  const toast = useSelector(selectToasts)[0]; const dispatch = useDispatch();
  if (!toast) return null;
  const dismiss = () => dispatch(dismissToast(toast.id));
  return <Snackbar key={toast.id} open autoHideDuration={toast.severity === 'error' ? null : toast.duration ?? 4000} onClose={(event, reason) => { if (reason !== 'clickaway') dismiss(); }}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} ContentProps={{ role: toast.severity === 'error' ? 'alert' : 'status', style: { backgroundColor: colors[toast.severity] || colors.info, color: '#fff' } }}
    message={toast.message} action={<IconButton size="small" color="inherit" aria-label="Dismiss notification" onClick={dismiss}><CloseIcon fontSize="small" /></IconButton>} />;
}
