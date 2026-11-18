import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Load data on mount / when deps change.
 *   const { data, loading, error, reload, setData } = useApi(() => trialsApi.list(params), [params])
 */
export function useApi(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0);

  const reload = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      if (id === seq.current) setData(result);
    } catch (err) {
      if (id === seq.current) setError(err);
    } finally {
      if (id === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

/** Simple form state with per-field errors. */
export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
    setErrors((er) => (er[name] ? { ...er, [name]: undefined } : er));
  };
  const setValue = (name, value) => setValues((v) => ({ ...v, [name]: value }));
  return { values, setValues, setValue, onChange, errors, setErrors, reset: () => setValues(initial) };
}

/** Debounced value (search boxes). */
export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Paginated list with filters. Resets to page 1 whenever filters change.
 *   const list = useList(trialsApi.list, { q, status });
 */
export function useList(fetcher, filters = {}, pageSize = 20) {
  const [page, setPage] = useState(1);
  const key = JSON.stringify(filters);
  useEffect(() => setPage(1), [key]);
  const res = useApi(() => fetcher({ ...filters, page, page_size: pageSize }), [key, page]);
  return { ...res, page, setPage, pageSize, items: res.data?.items || [], total: res.data?.total || 0 };
}

/**
 * Submit helper for forms/modals: tracks loading + API errors.
 *   const submit = useSubmit();
 *   const res = await submit.run(() => api.create(values)); if (!res.ok) return;
 */
export function useSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const run = useCallback(async (fn) => {
    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      return { ok: true, data: await fn() };
    } catch (e) {
      setError(e.message);
      setFieldErrors(e.fieldErrors || {});
      return { ok: false, error: e };
    } finally {
      setLoading(false);
    }
  }, []);
  const reset = useCallback(() => {
    setError('');
    setFieldErrors({});
  }, []);
  return { loading, error, fieldErrors, run, reset, setError };
}
