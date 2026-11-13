import React, { useMemo } from 'react';
import { useAuth } from '../config/AuthContext';
import { linkTo } from '../config/routes';
import { dateString } from '../config/useDateRange';
import { useSelector } from 'react-redux';
import Grid from '@material-ui/core/Grid';
import OilBarrelIcon from '@material-ui/icons/LocalShipping';
import LocationIcon from '@material-ui/icons/Place';
import DescriptionIcon from '@material-ui/icons/Description';
import HourglassIcon from '@material-ui/icons/HourglassEmpty';
import KpiCard from './KpiCard';
import { useGetWellsQuery } from '../store/api/wellsApi';
import { useGetDeliveriesQuery } from '../store/api/deliveriesApi';
import { useGetShippingPapersQuery } from '../store/api/shippingPapersApi';
import { selectDateRange, selectCompanyId } from '../store/slices/dashboardFiltersSlice';

function withinRange(iso, start, end) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export default function KpiRow() {
  const { isAdmin } = useAuth();
  const dateRange = useSelector(selectDateRange);
  const companyId = useSelector(selectCompanyId);
  const dateFilters = { from: dateString(dateRange.startDate), to: dateString(dateRange.endDate), companyId: companyId || undefined };

  const wells = useGetWellsQuery({ limit: 1, company: companyId || undefined });
  const deliveries = useGetDeliveriesQuery({ limit: 500, company: companyId || undefined });
  const shippingPapers = useGetShippingPapersQuery({ limit: 500 });
  const pending = useGetDeliveriesQuery({ limit: 1, active: 0, company: companyId || undefined });

  const deliveriesInRange = useMemo(() => {
    const rows = deliveries.data?.data;
    if (!rows) return null;
    return rows.filter((d) =>
      withinRange(d.date, dateRange.startDate, dateRange.endDate)
    ).length;
  }, [deliveries.data, dateRange]);

  const shippingInRange = useMemo(() => {
    const rows = shippingPapers.data?.data;
    if (!rows) return null;
    return rows.filter((s) =>
      withinRange(s.date, dateRange.startDate, dateRange.endDate)
    ).length;
  }, [shippingPapers.data, dateRange]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Total wells"
          value={wells.data?.totalItems}
          hint={companyId ? 'Filtered by company' : 'All companies'}
          icon={<LocationIcon fontSize="small" />}
          accent="#dbeafe"
          accentText="#1e40af"
          to={isAdmin ? "/locationmanagment" : undefined}
          loading={wells.isFetching}
          error={wells.error}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Deliveries (range)"
          value={deliveriesInRange}
          hint="Within selected date range"
          icon={<OilBarrelIcon fontSize="small" />}
          accent="#dcfce7"
          accentText="#166534"
          to={linkTo("/delivery", dateFilters)}
          loading={deliveries.isFetching}
          error={deliveries.error}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Shipping Papers (range)"
          value={shippingInRange}
          hint="All shipping papers in selected dates"
          icon={<DescriptionIcon fontSize="small" />}
          accent="#ede9fe"
          accentText="#6d28d9"
          to={linkTo("/shippingpapers", { from: dateFilters.from, to: dateFilters.to })}
          loading={shippingPapers.isFetching}
          error={shippingPapers.error}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Pending Deliveries"
          value={pending.data?.totalItems}
          hint="Not yet completed"
          icon={<HourglassIcon fontSize="small" />}
          accent="#fee2e2"
          accentText="#b91c1c"
          to={linkTo("/delivery", { active: 0, companyId: companyId || undefined })}
          loading={pending.isFetching}
          error={pending.error}
        />
      </Grid>
    </Grid>
  );
}
