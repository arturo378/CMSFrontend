import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { parseGps } from '../config/mapCoordinates';
import QueryState from '../components/QueryState';
import { useGetWellsQuery } from '../store/api/wellsApi';
import { selectCompanyId } from '../store/slices/dashboardFiltersSlice';

const MapView = React.lazy(() => import('../config/MapView'));

const defaultCenter = {
  lat: 31.9686,
  lng: -99.9018,
};

const mapStyles = {
  width: '100%',
  height: 'clamp(260px, 42vh, 420px)',
  borderRadius: '12px',
};

export default function Orders() {
  const companyId = useSelector(selectCompanyId);
  const { currentData: data, error, isFetching, refetch } = useGetWellsQuery({ limit: 500, company: companyId || undefined });

  const marks = useMemo(() => {
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows
      .map((w) => {
        const p = parseGps(w.gps);
        return p ? { ...p, key: w.id, title: w.name } : null;
      })
      .filter(Boolean);
  }, [data]);

  if (error) return <QueryState error={error} onRetry={refetch} />;
  if (!data && isFetching) return <QueryState loading />;
  return (
    <React.Suspense fallback={<QueryState loading />}><MapView
      center={defaultCenter}
      zoom={5}
      markers={marks}
      style={mapStyles}
    /></React.Suspense>
  );
}
