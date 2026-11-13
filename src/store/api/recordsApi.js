import { baseApi } from './baseApi';
const resourceTags = { companies: 'Company', leases: 'Lease', wells: 'Well', warehouses: 'Warehouse', deliveries: 'Delivery', 'shipping-papers': 'ShippingPaper' };
export const recordsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getUiRecord: builder.query({
      query: ({ resource, id }) => {
        if (!resourceTags[resource]) throw new Error('Unknown record type');
        return { url: `/api/${resource}/${encodeURIComponent(id)}` };
      },
      providesTags: (result, error, { resource, id }) => [{ type: resourceTags[resource], id }],
    }),
  }),
});
export const { useGetUiRecordQuery } = recordsApi;
