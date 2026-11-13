import React from 'react';
import ReportWorkspace from '../components/ReportWorkspace';
import RecordPicker from '../components/RecordPicker';
import DateRangeControls from '../components/DateRangeControls';
import useDateRange from '../config/useDateRange';
import useQueryValue from '../config/useQueryValue';
import { useGetCompaniesQuery } from '../store/api/companiesApi';
import { useGetWeeklyEarningsQuery } from '../store/api/reportsApi';
const currency = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
export default function WeeklyEarnings() {
  const range = useDateRange(); const [company, setCompany] = useQueryValue('companyId');
  const companies = useGetCompaniesQuery({ limit: 100 });
  const query = useGetWeeklyEarningsQuery({ ...range.queryRange, company }, { skip: !company || range.invalid });
  const result = query.currentData; const rows = Array.isArray(result) ? result : result?.data || [];
  const quantity = rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0); const total = rows.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
  const selectedCompany = companies.currentData?.data.find(row => row.id === company);
  return <ReportWorkspace title="Earnings report" query={query} selected={company} rows={rows} invalid={range.invalid} lookupError={companies.error} retryLookup={companies.refetch}
    filters={<><div className="report-record-filter"><RecordPicker id="earnings-company" label="Company" value={company} options={(companies.currentData?.data || []).map(row => ({ value: row.id, label: row.name }))} onChange={setCompany} /></div><DateRangeControls range={range} /></>}
    summaries={[{ label: 'Total revenue', value: currency(total) }, { label: 'Total quantity', value: quantity.toLocaleString() }, { label: 'Records', value: rows.length.toLocaleString() }]}
    columns={[{ title: 'Date', field: 'date', render: row => row.date ? new Date(row.date).toLocaleDateString() : '—' }, { title: 'Data number', field: 'datanumber' }, { title: 'Lease', field: 'lease' }, { title: 'Well', field: 'well' }, { title: 'Product', field: 'chemical' }, { title: 'Quantity', field: 'quantity', type: 'numeric' }, { title: 'Price', field: 'price', type: 'numeric', render: row => currency(row.price) }, { title: 'Total', field: 'total', type: 'numeric', render: row => currency(row.total) }]}
    filename="Weekly_Report.xlsx" exportRows={() => [['Data Number', 'Date', 'Company', 'Lease', 'Well', 'GPS Coordinate', 'Chemical', 'Price', 'Quantity', 'Total'], ...rows.map(row => [row.datanumber, row.date ? new Date(row.date).toLocaleDateString() : '', selectedCompany?.name || '', row.lease, row.well, row.gps, row.chemical, row.price, row.quantity, row.total]), [], ['', '', '', '', '', '', 'Totals', '', quantity, total]]} />;
}
