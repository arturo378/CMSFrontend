import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, fireEvent, wait, act } from '@testing-library/react';
import { ConfirmationProvider } from './ConfirmationProvider';
import RecordForm, { validateFields } from './RecordForm';

const fields = [{ name: 'name', label: 'Lease name', required: true, wide: true }];
const mount = props => render(<ConfirmationProvider><MemoryRouter><RecordForm title="Add lease" fields={fields} record={null} {...props} /></MemoryRouter></ConfirmationProvider>);

test('validates beside the field and keeps entered values after a failed save', async () => {
  const save = jest.fn().mockRejectedValue(new Error('Save failed. Please retry.'));
  const close = jest.fn();
  const view = mount({ onSave: save, onClose: close });
  fireEvent.click(view.getByText('Save changes'));
  expect(view.getByText('Lease name is required.')).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(view.getByLabelText(/Lease name/), { target: { value: 'North lease' } });
  fireEvent.click(view.getByText('Save changes'));
  await view.findByText('Save failed. Please retry.');
  expect(view.getByLabelText(/Lease name/)).toHaveValue('North lease');
  expect(close).not.toHaveBeenCalled();
});

test('prevents duplicate saves and closes only after the request succeeds', async () => {
  let resolve;
  const save = jest.fn(() => new Promise(done => { resolve = done; }));
  const close = jest.fn();
  const view = mount({ onSave: save, onClose: close });
  fireEvent.change(view.getByLabelText(/Lease name/), { target: { value: 'North' } });
  const form = view.getByText('Save changes').closest('form');
  fireEvent.submit(form); fireEvent.submit(form);
  expect(save).toHaveBeenCalledTimes(1);
  expect(view.getByText('Cancel').closest('button')).toBeDisabled();
  expect(close).not.toHaveBeenCalled();
  await act(async () => { resolve({ id: 'saved' }); });
  await wait(() => expect(close).toHaveBeenCalledTimes(1));
});

test('asks before discarding dirty input', async () => {
  const close = jest.fn();
  const view = mount({ onSave: jest.fn(), onClose: close });
  fireEvent.change(view.getByLabelText(/Lease name/), { target: { value: 'Draft' } });
  fireEvent.click(view.getByText('Cancel'));
  await view.findByText('Discard unsaved changes?');
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(view.getByText('Discard changes'));
  await wait(() => expect(close).toHaveBeenCalledTimes(1));
});

test('allows zero prices and rejects quantities and relationships that do not match their parent', () => {
  const descriptors = [
    { name: 'price', label: 'Price', type: 'number', min: 0, required: true },
    { name: 'well', label: 'Well', type: 'record', required: true, options: [{ value: 'valid-well', label: 'Well' }] },
  ];
  expect(validateFields(descriptors, { price: 0, well: 'valid-well' })).toEqual({});
  expect(validateFields(descriptors, { price: -1, well: 'foreign-well' })).toHaveProperty('well');
  expect(validateFields(descriptors, { price: -1, well: 'foreign-well' })).toHaveProperty('price');
});
