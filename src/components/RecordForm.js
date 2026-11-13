import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, CircularProgress, useMediaQuery, InputAdornment } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { DirtyFormGuard, useConfirmation } from './ConfirmationProvider';
import RecordPicker from './RecordPicker';
import { recordId } from '../config/routes';

export function dateInput(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
export function validateFields(fields, values) {
  const errors = {};
  fields.forEach(field => {
    if (field.hidden?.(values)) return;
    const value = values[field.name];
    if (field.required && !String(value ?? '').trim()) errors[field.name] = field.label + ' is required.';
    else if (field.type === 'record' && value && !(typeof field.options === 'function' ? field.options(values) : field.options || []).some(option => String(option.value) === String(value))) errors[field.name] = 'Choose an available ' + field.label.toLowerCase() + '.';
    else if (value !== '' && value != null && field.type === 'number' && (!Number.isFinite(Number(value)) || (field.min != null && Number(value) < field.min))) errors[field.name] = field.label + ' must be ' + (field.min > 0 ? 'greater than zero.' : 'zero or greater.');
    else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[field.name] = 'Enter a valid email address.';
    else if (field.minLength && value && String(value).length < field.minLength) errors[field.name] = 'Use at least ' + field.minLength + ' characters.';
    else if (field.matches && value !== values[field.matches]) errors[field.name] = 'Passwords do not match.';
    else if (field.validate) { const error = field.validate(value, values); if (error) errors[field.name] = error; }
  });
  return errors;
}
export default function RecordForm({ title, fields, record, onSave, onClose, saveLabel = 'Save changes' }) {
  const initial = useMemo(() => Object.fromEntries(fields.map(field => [field.name, field.type === 'date' ? dateInput(record?.[field.name] || field.defaultValue) : field.type === 'record' ? recordId(record?.[field.name]) : record?.[field.name] ?? field.defaultValue ?? ''])), [fields, record]);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const formRef = useRef(null);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('xs'));
  const confirmation = useConfirmation();
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const close = async () => {
    if (pending.current) return;
    if (!dirty || await confirmation.confirm({ title: 'Discard unsaved changes?', message: 'Your changes have not been saved.', confirmLabel: 'Discard changes', danger: true })) onClose();
  };
  const submit = async event => {
    event.preventDefault();
    if (pending.current) return;
    const nextErrors = validateFields(fields, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const input = formRef.current?.querySelector('[name="' + Object.keys(nextErrors)[0] + '"], [id="record-' + Object.keys(nextErrors)[0] + '"]');
      input?.focus();
      return;
    }
    pending.current = true; setSaving(true); setFailure('');
    try {
      const payload = { ...values };
      fields.forEach(field => {
        if (field.hidden?.(values) || field.omit) delete payload[field.name];
        else if (field.type === 'number' && payload[field.name] !== '') payload[field.name] = Number(payload[field.name]);
        else if (field.type === 'date' && payload[field.name]) payload[field.name] = new Date(payload[field.name] + 'T00:00:00').toISOString();
      });
      await onSave(payload, record);
      pending.current = false;
      if (mounted.current) { setSaving(false); onClose(); }
    } catch (error) { setFailure(error?.message || 'Unable to save. Your changes are still here. Please try again.'); }
    finally { if (pending.current) { pending.current = false; if (mounted.current) setSaving(false); } }
  };
  return <Dialog open onClose={close} fullWidth maxWidth="sm" fullScreen={fullScreen} aria-labelledby="record-form-title" disableEscapeKeyDown={saving}>
    <DirtyFormGuard dirty={dirty} saving={saving} />
    <form onSubmit={submit} noValidate ref={formRef} aria-busy={saving}>
      <DialogTitle id="record-form-title">{title}</DialogTitle>
      <DialogContent>
        {failure && <div role="alert" className="form-error" tabIndex={-1}>{failure}</div>}
        <div className="record-form">{fields.filter(field => !field.hidden?.(values)).map((field, index) => {
          const options = typeof field.options === 'function' ? field.options(values) : field.options;
          const change = value => setValues(current => {
            const next = { ...current, [field.name]: value };
            (field.resets || []).forEach(name => { next[name] = ''; });
            return next;
          });
          const disabled = saving || (typeof field.disabled === 'function' ? field.disabled(values) : field.disabled);
          return <div key={field.name} className={field.wide || field.multiline ? 'form-wide' : undefined}>
            {field.type === 'record' ? <RecordPicker id={'record-' + field.name} label={field.label} value={values[field.name]} options={options} onChange={change} disabled={disabled} required={field.required} error={errors[field.name]} helperText={field.helperText} /> :
              <TextField id={'record-' + field.name} name={field.name} label={field.label} fullWidth margin="none" autoFocus={index === 0} disabled={disabled} required={field.required}
                value={values[field.name]} onChange={event => change(event.target.value)} error={Boolean(errors[field.name])} helperText={errors[field.name] || field.helperText}
                type={field.type === 'select' || (field.type === 'password' && visiblePasswords[field.name]) ? 'text' : field.type || 'text'} select={field.type === 'select'} multiline={field.multiline} rows={field.multiline ? 3 : undefined}
                InputProps={field.type === 'password' ? { endAdornment: <InputAdornment position="end"><Button size="small" disabled={saving} aria-label={(visiblePasswords[field.name] ? 'Hide ' : 'Show ') + field.label.toLowerCase()} onClick={() => setVisiblePasswords(current => ({ ...current, [field.name]: !current[field.name] }))}>{visiblePasswords[field.name] ? 'Hide' : 'Show'}</Button></InputAdornment> } : undefined}
                InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                inputProps={{ min: field.min, step: field.step || (field.type === 'number' ? 'any' : undefined), autoComplete: field.autoComplete }}>
                {field.type === 'select' ? (options || []).map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>) : undefined}
              </TextField>}
          </div>;
        })}</div>
      </DialogContent>
      <DialogActions><Button onClick={close} disabled={saving}>Cancel</Button><Button variant="contained" color="primary" type="submit" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>{saving ? 'Saving…' : saveLabel}</Button></DialogActions>
    </form>
  </Dialog>;
}
