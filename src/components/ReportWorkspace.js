import React, { useState } from 'react';
import { Button, Grid, Paper, Typography, LinearProgress } from '@material-ui/core';
import GetAppIcon from '@material-ui/icons/GetApp';
import RefreshIcon from '@material-ui/icons/Refresh';
import PageTitle from './PageTitle';
import QueryState from './QueryState';
import MaterialTable from '../config/MaterialTable';
import { exportAoaToXlsx } from '../config/excelExport';
export default function ReportWorkspace({ title, query, selected, rows, columns, summaries, filters, exportRows, filename, lookupError, retryLookup, invalid }) {
  const [exporting, setExporting] = useState(false); const [exportError, setExportError] = useState('');
  const ready = selected && !invalid && !lookupError && !query.error && Boolean(query.currentData);
  const download = async () => {
    if (exporting || !ready) return;
    setExporting(true); setExportError('');
    try { await exportAoaToXlsx(exportRows(), filename); } catch (error) { setExportError(error?.message || 'Unable to prepare the Excel file. Please try again.'); }
    finally { setExporting(false); }
  };
  return <div>
    <PageTitle actions={<Button variant="contained" color="primary" startIcon={<GetAppIcon />} onClick={download} disabled={!ready || !rows.length || query.isFetching || exporting}>{exporting ? 'Preparing Excel…' : 'Download Excel'}</Button>}>{title}</PageTitle>
    <Paper variant="outlined" className="report-filters"><div className="filter-bar">{filters}<Button startIcon={<RefreshIcon />} onClick={query.refetch} disabled={!selected || invalid || query.isFetching}>Refresh</Button></div>{invalid !== undefined && <Typography variant="caption" color="textSecondary">Date ranges include the full selected days in your local timezone.</Typography>}</Paper>
    {exportError && <div className="form-error" role="alert">{exportError}</div>}
    {lookupError ? <QueryState error={lookupError} title="Unable to load filter choices" onRetry={retryLookup} /> : invalid ? <QueryState title="Check the date range" description="Choose valid dates, with the end on or after the start." /> : !selected ? <QueryState title="Choose a record to load the report" description="Select a filter above. The report will load automatically." /> : query.error ? <QueryState error={query.error} onRetry={query.refetch} /> : !query.currentData ? <QueryState loading /> : <>
      {query.isFetching && <LinearProgress aria-label="Refreshing report" />}
      <Grid container spacing={2} className="report-summary">{summaries.map(summary => <Grid item xs={12} sm={4} key={summary.label}><Paper variant="outlined" className="summary-tile"><Typography color="textSecondary" variant="body2">{summary.label}</Typography><Typography variant="h5">{summary.value}</Typography></Paper></Grid>)}</Grid>
      {rows.length ? <MaterialTable columns={columns} data={rows} /> : <QueryState title="No results for these filters" description="Try another record or a wider date range." />}
    </>}
  </div>;
}
