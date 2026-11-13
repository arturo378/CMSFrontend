import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@material-ui/core';
import QueryState from './QueryState';
const MapView = React.lazy(() => import('../config/MapView'));
export default function MapDialog({ position, onClose }) {
  return <Dialog open={Boolean(position)} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="record-map-title">
    <DialogTitle id="record-map-title">Record location</DialogTitle>
    <DialogContent>{position && <React.Suspense fallback={<QueryState loading />}><MapView center={position} zoom={13} markers={[position]} style={{ height: 'min(55vh, 440px)', minHeight: 220, width: '100%' }} /></React.Suspense>}</DialogContent>
    <DialogActions><Button onClick={onClose}>Close map</Button></DialogActions>
  </Dialog>;
}
