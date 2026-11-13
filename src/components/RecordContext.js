import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useGetUiRecordQuery } from '../store/api/recordsApi';
import { recordId } from '../config/routes';
import QueryState from './QueryState';
import PageTitle from './PageTitle';
import { routeFor } from '../config/routes';
export default function RecordContext({ resource, param, legacy = 'id', back, backLabel, children }) {
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const id = params.has(param) ? params.get(param) : recordId(location.state?.[legacy]);
  const valid = /^[a-f\d]{24}$/i.test(id || '');
  const query = useGetUiRecordQuery({ resource, id }, { skip: !valid });
  useEffect(() => {
    if (valid && !new URLSearchParams(location.search).has(param)) {
      const next = new URLSearchParams(location.search);
      next.set(param, id);
      history.replace({ ...location, search: `?${next}`, state: undefined });
    }
  }, [valid, id, param, history, location]);
  const wrap = state => <div><PageTitle>{routeFor(location.pathname)?.title || 'Record'}</PageTitle>{state}</div>;
  if (!valid) return wrap(<QueryState title="Choose a parent record" description="Open this page from its parent list to choose the record you want to manage." to={back} actionLabel={backLabel} />);
  if (query.error) return wrap(<QueryState error={query.error} title="This record is unavailable" description="It may have been removed, or it may belong to another client." onRetry={query.refetch} to={back} actionLabel={backLabel} />);
  if (!query.currentData) return wrap(<QueryState loading />);
  return children(query.currentData);
}
