import React from 'react';
import { Button, CircularProgress, Paper, Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import InboxOutlined from '@material-ui/icons/InboxOutlined';
export default function QueryState({ loading, error, title, description, onRetry, to, actionLabel }) {
  return <Paper className="query-state" variant="outlined" role={error ? 'alert' : 'status'}>
    {loading ? <CircularProgress size={28} aria-label="Loading records" /> : <InboxOutlined color="disabled" style={{ fontSize: 36 }} />}
    <Typography variant="h6" component="h2">{loading ? 'Loading…' : title || (error ? 'Unable to load records' : 'No records yet')}</Typography>
    <Typography color="textSecondary" variant="body2">{description || error?.message}</Typography>
    {onRetry && <Button variant="outlined" onClick={onRetry}>Try again</Button>}
    {to && <Button component={Link} role="link" to={to} variant="contained" color="primary">{actionLabel || 'Go back'}</Button>}
  </Paper>;
}
