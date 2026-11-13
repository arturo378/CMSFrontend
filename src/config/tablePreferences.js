export const tableDefaults = { search: '', page: 0, pageSize: 10, sort: '', direction: '', dense: false };
export function readTablePreferences(search, saved = {}) {
  const params = new URLSearchParams(search);
  const size = Number(params.get('pageSize') || saved.pageSize || 10);
  const page = Number(params.get('page') || Number(saved.page || 0) + 1);
  return {
    search: params.has('q') ? params.get('q') : saved.search || '',
    page: Number.isSafeInteger(page) && page > 0 ? page - 1 : 0,
    pageSize: [5, 10, 20, 25, 50, 100].includes(size) ? size : 10,
    sort: params.get('sort') || saved.sort || '',
    direction: ['asc', 'desc'].includes(params.get('direction') || saved.direction) ? params.get('direction') || saved.direction : '',
    dense: params.has('dense') ? params.get('dense') === 'true' : Boolean(saved.dense),
  };
}
