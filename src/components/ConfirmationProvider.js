import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';
import { Prompt } from 'react-router-dom';

const Context = createContext(null);
export function ConfirmationProvider({ children }) {
  const [request, setRequest] = useState(null);
  const queue = useRef([]);
  const [dirtyForms, setDirtyForms] = useState({});
  const dirtyRef = useRef({});
  const confirm = useCallback(options => new Promise(resolve => {
    queue.current.push({ ...options, resolve });
    setRequest(current => current || queue.current[0]);
  }), []);
  const finish = accepted => {
    queue.current.shift()?.resolve(accepted);
    setRequest(queue.current[0] || null);
  };
  const register = useCallback((id, dirty, saving = false) => setDirtyForms(current => {
    const next = { ...current };
    if (dirty) next[id] = saving ? 'saving' : true; else delete next[id];
    dirtyRef.current = next;
    return next;
  }), []);
  const dirty = Object.keys(dirtyForms).length > 0;
  const saving = Object.values(dirtyForms).includes('saving');
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const isDirty = () => Object.keys(dirtyRef.current).length > 0;
  const discard = async () => {
    if (Object.values(dirtyRef.current).includes('saving')) return false;
    const accepted = !isDirty() || await confirm({ title: 'Discard unsaved changes?', message: 'Your changes have not been saved.', confirmLabel: 'Discard changes', danger: true });
    if (accepted) { dirtyRef.current = {}; setDirtyForms({}); }
    return accepted;
  };
  return <Context.Provider value={{ confirm, register, dirty, saving, discard, isDirty }}>
    {children}
    <Dialog open={Boolean(request)} onClose={() => finish(false)} aria-labelledby="confirmation-title" maxWidth="xs" fullWidth>
      <DialogTitle id="confirmation-title">{request?.title}</DialogTitle>
      <DialogContent><DialogContentText>{request?.message}</DialogContentText></DialogContent>
      <DialogActions>
        <Button onClick={() => finish(false)} autoFocus>Cancel</Button>
        <Button onClick={() => finish(true)} variant="contained" color={request?.danger ? 'secondary' : 'primary'}>{request?.confirmLabel || 'Continue'}</Button>
      </DialogActions>
    </Dialog>
  </Context.Provider>;
}
export const useConfirmation = () => useContext(Context);
export function DirtyFormGuard({ dirty, saving = false }) {
  const context = useConfirmation();
  const key = useRef(`form-${Math.random().toString(36).slice(2)}`).current;
  const register = context?.register;
  useEffect(() => {
    register?.(key, dirty || saving, saving);
    return () => register?.(key, false);
  }, [key, dirty, saving, register]);
  return <Prompt when={dirty || saving} message={() => saving ? false : !context?.isDirty() || 'You have unsaved changes. Leave this page and discard them?'} />;
}
