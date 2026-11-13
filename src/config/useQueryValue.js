import { useHistory, useLocation } from 'react-router-dom';
export default function useQueryValue(name, fallback = '') {
  const history = useHistory(); const location = useLocation();
  const value = new URLSearchParams(location.search).get(name) ?? fallback;
  const setValue = next => {
    const params = new URLSearchParams(location.search);
    if (next === '' || next == null) params.delete(name); else params.set(name, next);
    params.delete('page');
    history.replace({ ...location, search: params.toString() ? '?' + params : '' });
  };
  return [value, setValue];
}
