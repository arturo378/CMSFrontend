import React from 'react';
import ReportWorkspace from '../components/ReportWorkspace';
import RecordPicker from '../components/RecordPicker';
import DateRangeControls from '../components/DateRangeControls';
import useDateRange from '../config/useDateRange';
import useQueryValue from '../config/useQueryValue';
import { useAuth } from '../config/AuthContext';
import { useGetUsersQuery } from '../store/api/usersApi';
import { useGetUserActivityQuery } from '../store/api/reportsApi';
export default function UserReport() {
  const { user, isAdmin } = useAuth(); const range = useDateRange(); const [selectedUser, setUser] = useQueryValue('userId'); const userId = isAdmin ? selectedUser : user?.id;
  const users = useGetUsersQuery({ limit: 100 }, { skip: !isAdmin });
  const query = useGetUserActivityQuery({ ...range.queryRange, userId }, { skip: !userId || range.invalid });
  const rows = [...(query.currentData?.deliveries || []).map(row => ({ ...row, _recordType: 'Delivery' })), ...(query.currentData?.shippingPapers || []).map(row => ({ ...row, _recordType: 'Shipping paper' }))];
  return <ReportWorkspace title="User activity" query={query} selected={userId} rows={rows} invalid={range.invalid} lookupError={isAdmin ? users.error : null} retryLookup={users.refetch}
    filters={<>{isAdmin && <div className="report-record-filter"><RecordPicker id="activity-user" label="User" value={userId} options={(users.currentData?.data || []).map(row => ({ value: row.id, label: row.fullname || row.name || row.username }))} onChange={setUser} /></div>}<DateRangeControls range={range} /></>}
    summaries={[{ label: 'Deliveries', value: rows.filter(row => row._recordType === 'Delivery').length }, { label: 'Shipping papers', value: rows.filter(row => row._recordType === 'Shipping paper').length }, { label: 'Records', value: rows.length }]}
    columns={[{ title: 'Date', field: 'date', render: row => row.date ? new Date(row.date).toLocaleDateString() : '—' }, { title: 'Data number', field: 'datanumber' }, { title: 'Type', field: '_recordType' }, { title: 'Company', field: 'company.name' }, { title: 'Lease', field: 'lease.name' }, { title: 'Well', field: 'well.name' }, { title: 'Comments', field: 'comments' }]}
    filename="User_Report.xlsx" exportRows={() => [['Data Number', 'Date', 'Type', 'Company', 'Lease', 'Well', 'GPS Coordinate', 'Comments', 'Origin Warehouse', 'Destination Warehouse', 'Truck Number'], ...rows.map(row => [row.datanumber, row.date ? new Date(row.date).toLocaleDateString() : '', row._recordType, row.company?.name || '', row.lease?.name || '', row.well?.name || '', row.gps, row.comments, row.originwarehousenumber, row.destinationwarehousenumber, row.trucknumber])]} />;
}
