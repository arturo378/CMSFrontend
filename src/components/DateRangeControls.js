import React from 'react';
import { TextField, MenuItem } from '@material-ui/core';
export default function DateRangeControls({ range }) {
  return <>
    <TextField id="date-range-preset" select label="Date range" size="small" value={range.preset} onChange={event => range.setPreset(event.target.value)} style={{ minWidth: 150 }}>
      {Object.entries({ last7: 'Last 7 days', last30: 'Last 30 days', thisMonth: 'This month', lastMonth: 'Last month', custom: 'Custom range' }).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
    </TextField>
    <TextField id="date-range-from" label="From" type="date" size="small" value={range.from} onChange={event => range.setFrom(event.target.value)} InputLabelProps={{ shrink: true }} error={!range.startDate} />
    <TextField id="date-range-to" label="To" type="date" size="small" value={range.to} onChange={event => range.setTo(event.target.value)} InputLabelProps={{ shrink: true }} error={range.invalid} helperText={range.invalid ? 'Choose valid dates, with the end on or after the start.' : undefined} />
  </>;
}
