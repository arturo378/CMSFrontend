import React from 'react';
import { Button, Typography, makeStyles } from '@material-ui/core';
import { resetDemoData } from '../demo/api';
import { clearActiveClientId } from '../config/clientContext';

const useStyles = makeStyles((theme) => ({
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 3),
    backgroundColor: '#eff6ff',
    color: '#1e3a8a',
    borderBottom: '1px solid #bfdbfe',
  },
}));

export default function DemoBanner() {
  const classes = useStyles();
  const reset = () => {
    resetDemoData();
    clearActiveClientId();
    // Return to the dashboard so detail routes cannot retain removed row IDs.
    window.location.assign('/');
  };
  return (
    <div className={classes.banner} role="region" aria-label="Demo mode">
      <Typography variant="body2">
        <strong>Demo mode · Superuser</strong> — Sample data. Changes are saved in this browser.
      </Typography>
      <Button size="small" color="primary" onClick={reset}>Reset demo data</Button>
    </div>
  );
}
