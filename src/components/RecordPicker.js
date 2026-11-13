import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItem, ListItemText, Typography } from '@material-ui/core';
export default function RecordPicker({ id, label, value, options = [], onChange, disabled, required, error, helperText }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find(option => String(option.value) === String(value));
  const filtered = options.filter(option => option.label.toLowerCase().includes(search.toLowerCase()));
  const show = () => { if (!disabled) { setSearch(''); setOpen(true); } };
  return <>
    <TextField id={id} label={label} value={selected?.label || (value ? 'Selected record' : '')} fullWidth required={required} disabled={disabled} error={Boolean(error)} helperText={error || helperText}
      onClick={show} onKeyDown={event => { if (['ArrowDown', 'Enter', ' '].includes(event.key)) { event.preventDefault(); show(); } }}
      inputProps={{ readOnly: true, role: 'combobox', 'aria-expanded': open, 'aria-haspopup': 'dialog', 'aria-controls': open ? id + '-picker' : undefined }} />
    <Dialog id={id + '-picker'} open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" aria-labelledby={id + '-picker-title'}>
      <DialogTitle id={id + '-picker-title'}>Choose {label.toLowerCase()}</DialogTitle>
      <DialogContent>
        <TextField label={'Search ' + label.toLowerCase()} autoFocus fullWidth value={search} onChange={event => setSearch(event.target.value)} />
        <List className="record-picker-list" aria-label={label + ' options'}>
          {filtered.map(option => <ListItem key={option.value} button component="button" type="button" selected={String(value) === String(option.value)} onClick={() => { onChange(option.value); setOpen(false); }}><ListItemText primary={option.label} /></ListItem>)}
          {!filtered.length && <Typography color="textSecondary" style={{ padding: 16 }}>{search ? 'No matching records.' : 'No records available.'}</Typography>}
        </List>
      </DialogContent>
      <DialogActions>{!required && <Button onClick={() => { onChange(''); setOpen(false); }}>Clear selection</Button>}<Button onClick={() => setOpen(false)}>Cancel</Button></DialogActions>
    </Dialog>
  </>;
}
