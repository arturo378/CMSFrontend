import React from 'react';
import { Provider } from 'react-redux';
import { render, fireEvent } from '@testing-library/react';
import App from './App';
import { createAppStore } from './store';
import { APP_TITLE } from './config/appInfo';
test('signed-out users can sign in and access account recovery', () => {
  const { getByRole, getByLabelText, getByText } = render(<Provider store={createAppStore()}><App /></Provider>);
  expect(getByRole('heading', { name: APP_TITLE })).toBeInTheDocument();
  expect(getByRole('button', { name: 'Sign in' })).toBeDisabled();
  fireEvent.change(getByLabelText('Email'), { target: { value: 'person@example.com' } });
  fireEvent.change(getByLabelText('Password'), { target: { value: 'example-password' } });
  expect(getByRole('button', { name: 'Sign in' })).not.toBeDisabled();
  fireEvent.click(getByRole('button', { name: 'Show password' }));
  expect(getByLabelText('Password')).toHaveAttribute('type', 'text');
  fireEvent.click(getByRole('button', { name: 'Forgot password?' }));
  expect(getByText('Send code')).toBeInTheDocument();
});
