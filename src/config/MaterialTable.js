import React, { useRef, useEffect, useCallback, useMemo, useContext, useState } from 'react';
import MaterialTable, { MTablePagination, MTableToolbar } from 'material-table';
import { TablePagination, CircularProgress, Button } from '@material-ui/core';
import { alpha } from '@material-ui/core/styles';
import { __RouterContext } from 'react-router';
import { getCurrentUser } from './api';
import { getActiveClientId } from './clientContext';
import { readTablePreferences, tableDefaults } from './tablePreferences';
import tableIcons from './tableIcons';

function TableAction({ action: rawAction, data, disabled }) {
  let action = typeof rawAction === 'function' ? rawAction(data) : rawAction;
  if (action?.action) action = action.action(data);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  if (!action || action.hidden) return null;
  return <span>
    <Button className="table-action" size="small" color="primary" disabled={disabled || action.disabled || pending} onClick={event => {
      event.stopPropagation();
      setError('');
      try {
        const result = action.onClick?.(event, data);
        if (result?.then) {
          setPending(true); setError('');
          Promise.resolve(result).catch(failure => { if (mounted.current) setError(failure?.message || 'Action failed. Try again.'); }).finally(() => { if (mounted.current) setPending(false); });
        }
      } catch (failure) { setError(failure?.message || 'Action failed. Try again.'); }
    }}>{pending ? 'Working…' : action.label || action.tooltip || 'Open'}</Button>
    {error && <span role="alert" className="form-error">{error}</span>}
  </span>;
}

// Patch: material-table passes deprecated `onChangePage`/`onChangeRowsPerPage`
// to MUI's TablePagination, which warns and requires the new `onPageChange`
// name. Remap to new names, then wrap ActionsComponent (material-table's
// MTablePagination) so it still receives `onChangePage` as it expects.
function PatchedPagination(props) {
  const {
    onChangePage,
    onChangeRowsPerPage,
    ActionsComponent,
    ...rest
  } = props;

  const WrappedActions = ActionsComponent
    ? function WrappedActionsComponent(actionProps) {
        const { onPageChange, ...actionRest } = actionProps;
        return (
          <ActionsComponent
            {...actionRest}
            onChangePage={onPageChange}
          />
        );
      }
    : undefined;

  return (
    <TablePagination
      {...rest}
      onPageChange={onChangePage}
      onRowsPerPageChange={onChangeRowsPerPage}
      ActionsComponent={WrappedActions}
    />
  );
}

// Patch: material-table's OverlayLoading uses the deprecated `fade` utility.
// Provide a replacement that uses `alpha`.
function PatchedOverlayLoading(props) {
  return (
    <div
      style={{
        display: 'table',
        width: '100%',
        height: '100%',
        backgroundColor: alpha('#fff', 0.7),
      }}
    >
      <div
        style={{
          display: 'table-cell',
          width: '100%',
          height: '100%',
          verticalAlign: 'middle',
          textAlign: 'center',
        }}
      >
        <CircularProgress size={60} />
      </div>
    </div>
  );
}

export default function PatchedMaterialTable(props) {
  const router = useContext(__RouterContext);
  const location = router?.location;
  const contextParams = new URLSearchParams(location?.search || '');
  ['q', 'page', 'pageSize', 'sort', 'direction', 'dense'].forEach(key => contextParams.delete(key));
  contextParams.sort();
  const storageKey = ['cms-table', getCurrentUser()?.id || 'anonymous', getActiveClientId() || 'home', location?.pathname || props.title || 'table', contextParams.toString()].join(':');
  const [view, setView] = useState(() => {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(storageKey)) || {}; } catch {}
    return readTablePreferences(location?.search || '', { pageSize: props.options?.pageSize || 10, ...saved });
  });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [version, setVersion] = useState(0);
  const persist = changes => {
    const next = { ...viewRef.current, ...changes };
    viewRef.current = next;
    setView(next);
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
    if (router) {
      const params = new URLSearchParams(location.search);
      Object.entries({ q: next.search, page: next.page ? next.page + 1 : '', pageSize: next.pageSize === 10 ? '' : next.pageSize, sort: next.sort, direction: next.direction, dense: next.dense ? 'true' : '' }).forEach(([key, value]) => { if (value === '') params.delete(key); else params.set(key, value); });
      const search = params.toString() ? `?${params}` : '';
      if (search !== location.search) router.history.replace({ ...location, search });
    }
  };
  const mountedRef = useRef(true);
  const dataRef = useRef(props.data);
  dataRef.current = props.data;

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Wrap remote-data functions so the promise never resolves after unmount,
  // preventing material-table from calling setState on an unmounted component.
  const wrappedData = useCallback((query) => {
    return new Promise((resolve, reject) => {
      Promise.resolve(dataRef.current(query)).then(result => {
        if (mountedRef.current) {
          // material-table mutates rows to attach `tableData`; clone frozen
          // RTK Query rows so the assignment doesn't throw.
          if (result && Array.isArray(result.data)) {
            resolve({ ...result, data: result.data.map(row => ({ ...row })) });
          } else {
            resolve(result);
          }
        }
      }).catch(err => {
        if (mountedRef.current) reject(err);
      });
    });
  }, []);

  // RTK Query returns frozen (Immer) objects. material-table adds a
  // `tableData` field to each row, which fails on frozen objects with
  // "Cannot add property tableData, object is not extensible". Shallow-clone
  // each row so it stays extensible. Memoize on the source array identity so
  // material-table's internal state (sort/filter/page) isn't reset each render.
  const clonedArrayData = useMemo(() => {
    if (!Array.isArray(props.data)) return null;
    return props.data.map(row => (row && typeof row === 'object' ? { ...row } : row));
  }, [props.data]);

  const dataProp = typeof props.data === 'function'
    ? wrappedData
    : clonedArrayData !== null
      ? clonedArrayData
      : props.data;

  const columns = useMemo(() => props.columns.map(column => ({ ...column, ...(view.sort ? { defaultSort: column.field === view.sort ? view.direction || undefined : undefined } : {}) })), [props.columns, view.sort, view.direction]);
  const maxPage = Array.isArray(dataProp) ? Math.max(0, Math.ceil(dataProp.length / view.pageSize) - 1) : view.page;
  return (
    <section className="data-table" aria-label={props.title || 'Records'}>
    <div className="table-summary"><span>{Array.isArray(dataProp) ? `${dataProp.length.toLocaleString()} records · Search and sort this list` : 'Records'}</span><span>
      {(view.search || view.sort || view.page > 0) && <Button onClick={() => { persist({ ...tableDefaults, dense: view.dense }); setVersion(current => current + 1); }}>Reset view</Button>}
      <Button aria-pressed={view.dense} onClick={() => persist({ dense: !view.dense })}>{view.dense ? 'Comfortable view' : 'Compact view'}</Button>
    </span></div>
    <MaterialTable
      {...props}
      key={version}
      icons={{ ...tableIcons, ...props.icons }}
      title={props.title || ''}
      columns={columns}
      data={dataProp}
      options={{ pageSizeOptions: [5, 10, 20, 25, 50, 100], search: true, showTitle: false, actionsColumnIndex: -1, emptyRowsWhenPaging: false, debounceInterval: 200, ...props.options, pageSize: view.pageSize, initialPage: Math.min(view.page, maxPage), searchText: view.search, padding: view.dense ? 'dense' : 'default' }}
      onSearchChange={search => { persist({ search, page: 0 }); props.onSearchChange?.(search); }}
      onChangePage={(page, pageSize) => { persist({ page, pageSize: Number(pageSize) }); props.onChangePage?.(page, pageSize); }}
      onChangeRowsPerPage={pageSize => { persist({ page: 0, pageSize: Number(pageSize) }); props.onChangeRowsPerPage?.(pageSize); }}
      onOrderChange={(index, direction) => { persist({ sort: props.columns[index]?.field || '', direction, page: 0 }); props.onOrderChange?.(index, direction); }}
      localization={{ ...props.localization, body: { ...props.localization?.body, emptyDataSourceMessage: view.search ? 'No matching records. Clear your search or reset the view.' : props.localization?.body?.emptyDataSourceMessage || 'No records yet.' }, toolbar: { searchPlaceholder: 'Search records', searchTooltip: 'Search this list', ...props.localization?.toolbar } }}
      components={{
        Pagination: PatchedPagination,
        OverlayLoading: PatchedOverlayLoading,
        Action: TableAction,
        ...props.components,
      }}
    />
    </section>
  );
}

export { MTablePagination, MTableToolbar };
