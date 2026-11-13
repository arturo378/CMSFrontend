import React from 'react';
import ReportWorkspace from '../components/ReportWorkspace';
import RecordPicker from '../components/RecordPicker';
import useQueryValue from '../config/useQueryValue';
import { useGetWarehousesQuery } from '../store/api/warehousesApi';
import { useGetWarehouseInventoryReportQuery } from '../store/api/reportsApi';
export default function WarehouseInventory() {
  const [warehouse, setWarehouse] = useQueryValue('warehouseId'); const warehouses = useGetWarehousesQuery({ limit: 100 });
  const query = useGetWarehouseInventoryReportQuery({ warehouse }, { skip: !warehouse });
  const result = query.currentData; const rows = Array.isArray(result) ? result : result?.data || [];
  const quantity = rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0); const products = new Set(rows.map(row => row.chemical)).size;
  return <ReportWorkspace title="Inventory levels" query={query} selected={warehouse} rows={rows} lookupError={warehouses.error} retryLookup={warehouses.refetch}
    filters={<div className="report-record-filter"><RecordPicker id="inventory-warehouse" label="Warehouse" value={warehouse} options={(warehouses.currentData?.data || []).map(row => ({ value: row.id, label: row.name }))} onChange={setWarehouse} /></div>}
    summaries={[{ label: 'Total quantity', value: quantity.toLocaleString() }, { label: 'Unique products', value: products.toLocaleString() }, { label: 'Records', value: rows.length.toLocaleString() }]}
    columns={[{ title: 'Warehouse', field: 'warehouse' }, { title: 'Product', field: 'chemical' }, { title: 'Quantity', field: 'quantity', type: 'numeric' }, { title: 'Area manager', field: 'areamanager' }]}
    filename="Warehouse_Inventory_Report.xlsx" exportRows={() => [['Warehouse', 'Chemical', 'Quantity', 'Area Manager'], ...rows.map(row => [row.warehouse, row.chemical, row.quantity, row.areamanager]), [], ['', 'Totals', quantity, '']]} />;
}
