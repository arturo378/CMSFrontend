import React from 'react';
import ResourcePage from './ResourcePage';
import QueryState from './QueryState';
import { useAuth } from '../config/AuthContext';
import { paths } from '../config/routes';
import { useGetChemicalsQuery } from '../store/api/chemicalsApi';
import { useGetPricingQuery, useAddPricingMutation, useUpdatePricingMutation, useDeletePricingMutation } from '../store/api/pricingApi';
import { useGetWarehouseChemicalsQuery, useAddWarehouseChemicalMutation, useUpdateWarehouseChemicalMutation, useDeleteWarehouseChemicalMutation } from '../store/api/warehouseChemicalsApi';
import { useGetShippingChemicalsQuery, useAddShippingChemicalMutation, useUpdateShippingChemicalMutation, useDeleteShippingChemicalMutation } from '../store/api/shippingPapersApi';
import { useGetDeliveryChemicalsQuery, useAddDeliveryChemicalMutation, useUpdateDeliveryChemicalMutation, useDeleteDeliveryChemicalMutation } from '../store/api/deliveriesApi';
const config = {
  pricing: { title: 'Pricing', parent: 'company', back: paths.locations, backLabel: 'Locations', useList: useGetPricingQuery, useAdd: useAddPricingMutation, useUpdate: useUpdatePricingMutation, useRemove: useDeletePricingMutation },
  warehouse: { title: 'Warehouse inventory', parent: 'warehouse', back: paths.warehouses, backLabel: 'Warehouses', useList: useGetWarehouseChemicalsQuery, useAdd: useAddWarehouseChemicalMutation, useUpdate: useUpdateWarehouseChemicalMutation, useRemove: useDeleteWarehouseChemicalMutation },
  shipping: { title: 'Shipping chemicals', parent: 'shippingPaper', back: paths.shipping, backLabel: 'Shipping papers', useList: useGetShippingChemicalsQuery, useAdd: useAddShippingChemicalMutation, useUpdate: useUpdateShippingChemicalMutation, useRemove: useDeleteShippingChemicalMutation },
  delivery: { title: 'Delivery chemicals', parent: 'delivery', back: paths.deliveries, backLabel: 'Deliveries', useList: useGetDeliveryChemicalsQuery, useAdd: useAddDeliveryChemicalMutation, useUpdate: useUpdateDeliveryChemicalMutation, useRemove: useDeleteDeliveryChemicalMutation },
};
export default function ChemicalLinesPage({ type, parent }) {
  const { isAdmin } = useAuth();
  const { title, back, backLabel, parent: parentKey, useList, useAdd, useUpdate, useRemove } = config[type];
  const query = useList({ [parentKey]: parent.id, limit: 100 });
  const products = useGetChemicalsQuery({ limit: 100 });
  const [add] = useAdd(); const [update] = useUpdate(); const [remove] = useRemove();
  const valueField = type === 'pricing' ? 'price' : 'quantity';
  const label = type === 'pricing' ? 'Price (USD)' : 'Quantity';
  const fields = [
    { name: 'chemical', label: 'Product', type: 'record', required: true, wide: true, options: (products.currentData?.data || []).map(product => ({ value: product.id, label: product.tradename })) },
    { name: valueField, label, type: 'number', min: 0, required: true, wide: true },
  ];
  return <ResourcePage title={title} description={'Manage products for ' + (parent.name || parent.datanumber || 'this record') + '.'}
    breadcrumbs={[{ label: backLabel, to: back }, { label: parent.name || parent.datanumber || 'Record' }]}
    query={query} fields={fields} canEdit={isAdmin && Boolean(products.currentData) && !products.error} createLabel={type === 'pricing' ? 'Add price' : 'Add product'}
    columns={[{ title: 'Product', field: 'chemical.tradename', render: row => row.chemical?.tradename || 'Unavailable product' }, { title: label, field: valueField, type: 'numeric', ...(type === 'pricing' ? { render: row => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.price) } : {}) }]}
    onSave={(values, row) => (row ? update({ ...values, [parentKey]: parent.id, id: row.id }) : add({ ...values, [parentKey]: parent.id })).unwrap()}
    onDelete={row => remove(row.id).unwrap()}>
    {products.error && <QueryState error={products.error} title="Unable to load products for editing" onRetry={products.refetch} />}
  </ResourcePage>;
}
