import React from 'react';
import { render, fireEvent, waitForElement } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import authReducer from './store/slices/authSlice';

jest.mock('./config/demoMode', () => ({
  ...jest.requireActual('./config/demoMode'),
  DEMO_MODE: true,
  sessionKey: (key) => `cms.demo.${key}`,
}));

// Focus on the auth boundary; dashboard charts and maps have their own UI.
jest.mock('./Home', () => function MockHome() {
  const { useAuth } = require('./config/AuthContext');
  const { useDispatch } = require('react-redux');
  const { logout } = require('./store/slices/authSlice');
  const { user, isAdmin, isSuperAdmin, ready } = useAuth();
  const dispatch = useDispatch();
  return <div>
    <p>{ready && isAdmin && isSuperAdmin ? `Full access: ${user.fullname}` : 'Loading'}</p>
    <button onClick={() => dispatch(logout())}>Sign out</button>
  </div>;
});

test('opens with full demo permissions and allows sign out and re-entry without credentials', async () => {
  global.fetch = jest.fn();
  const store = configureStore({ reducer: { auth: authReducer } });
  const { getByText, unmount } = render(<Provider store={store}><App /></Provider>);
  await waitForElement(() => getByText('Full access: Demo Superuser'));
  fireEvent.click(getByText('Sign out'));
  await waitForElement(() => getByText('Enter demo'));
  fireEvent.click(getByText('Enter demo'));
  await waitForElement(() => getByText('Full access: Demo Superuser'));
  expect(global.fetch).not.toHaveBeenCalled();
  unmount();
  delete global.fetch;
});
