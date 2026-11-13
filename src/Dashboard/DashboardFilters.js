import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Paper, Button } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import DateRangeControls from '../components/DateRangeControls';
import RecordPicker from '../components/RecordPicker';
import useDateRange from '../config/useDateRange';
import useQueryValue from '../config/useQueryValue';
import { useGetCompaniesQuery } from '../store/api/companiesApi';
import { selectDateRangeIso, selectCompanyId, setDateRange, setCompany } from '../store/slices/dashboardFiltersSlice';
export default function DashboardFilters({ onRefresh }) {
  const range = useDateRange('last30'); const [companyId, setCompanyId] = useQueryValue('companyId'); const dispatch = useDispatch();
  const storedRange = useSelector(selectDateRangeIso); const storedCompany = useSelector(selectCompanyId);
  const companies = useGetCompaniesQuery({ limit: 100 });
  const { startDate, endDate } = range.queryRange;
  useEffect(() => { if (startDate && endDate && (startDate !== storedRange.startDate || endDate !== storedRange.endDate)) dispatch(setDateRange({ startDate, endDate })); }, [startDate, endDate, storedRange, dispatch]);
  useEffect(() => { if ((storedCompany || '') !== companyId) dispatch(setCompany(companyId)); }, [companyId, storedCompany, dispatch]);
  return <Paper variant="outlined" className="report-filters"><div className="filter-bar">
    <div className="report-record-filter"><RecordPicker id="dashboard-company" label="Company" value={companyId} onChange={setCompanyId} options={(companies.currentData?.data || []).map(row => ({ value: row.id, label: row.name }))} helperText={companies.error ? 'Unable to load companies.' : 'Clear selection for all companies.'} /></div>
    <DateRangeControls range={range} /><Button startIcon={<RefreshIcon />} onClick={onRefresh}>Refresh dashboard</Button>
    {companies.error && <Button onClick={companies.refetch}>Retry companies</Button>}
  </div></Paper>;
}
