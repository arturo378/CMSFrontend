import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Container, Grid, Paper, Typography } from '@material-ui/core';
import PageTitle from '../components/PageTitle';
import Chart from './Chart';
import Orders from './Orders';
import DashboardFilters from './DashboardFilters';
import KpiRow from './KpiRow';
import RevenueTrend from './RevenueTrend';
import DeliveriesByCompany from './DeliveriesByCompany';
import TopChemicals from './TopChemicals';
import WarehouseInventory from './WarehouseInventory';
import RecentActivity from './RecentActivity';
import PendingDeliveries from './PendingDeliveries';
import { baseApi } from '../store/api/baseApi';

function Panel({ children, tall = false }) {
  return <Paper component="section" variant="outlined" style={{ padding: 24, height: '100%', minHeight: tall ? 340 : undefined }}>{children}</Paper>;
}
function Row({ children }) {
  return <Grid container spacing={3} style={{ marginTop: 16 }}>{children}</Grid>;
}
export default function Main() {
  const dispatch = useDispatch();
  const refresh = useCallback(() => dispatch(baseApi.util.invalidateTags(['Dashboard', 'Delivery', 'ShippingPaper', 'Well', 'WarehouseChemical', 'Report'])), [dispatch]);
  return <Container maxWidth={false} disableGutters>
    <PageTitle>Dashboard</PageTitle>
    <DashboardFilters onRefresh={refresh} />
    <KpiRow />
    <Row>
      <Grid item xs={12} lg={5}><Panel><PendingDeliveries /></Panel></Grid>
      <Grid item xs={12} lg={7}><Panel><RecentActivity /></Panel></Grid>
    </Row>
    <Row>
      <Grid item xs={12} lg={8}><Panel tall><RevenueTrend /></Panel></Grid>
      <Grid item xs={12} lg={4}><Panel tall><DeliveriesByCompany /></Panel></Grid>
    </Row>
    <Row>
      <Grid item xs={12} lg={6}><Panel tall><Chart /></Panel></Grid>
      <Grid item xs={12} lg={6}><Panel tall><TopChemicals /></Panel></Grid>
    </Row>
    <Row>
      <Grid item xs={12} lg={6}><Panel><Typography variant="h6" component="h2" style={{ marginBottom: 16 }}>Wells map</Typography><Orders /></Panel></Grid>
      <Grid item xs={12} lg={6}><Panel tall><WarehouseInventory /></Panel></Grid>
    </Row>
  </Container>;
}
