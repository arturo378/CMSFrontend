import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getCurrentUser, getAccessToken, storeAuthSession, clearAuthSession } from '../../config/api';
import { clearActiveClientId } from '../../config/clientContext';
import { DEMO_MODE, DEMO_TOKEN } from '../../config/demoMode';
import { clearActiveClient } from './clientContextSlice';
import { resetFilters } from './dashboardFiltersSlice';
import { baseApi } from '../api/baseApi';

const initialState = {
  user: getCurrentUser(),
  accessToken: DEMO_MODE ? DEMO_TOKEN : getAccessToken() || null,
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      storeAuthSession(res);
      return { accessToken: res.accessToken, user: res.user };
    } catch (err) {
      return rejectWithValue(err?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, username, fullname, email, password, clientCode }, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/auth/register', { name, username, fullname, email, password, clientCode });
      storeAuthSession(res);
      return { accessToken: res.accessToken, user: res.user };
    } catch (err) {
      return rejectWithValue(err?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  try {
    await api.post('/api/auth/logout');
  } catch {
    // fire-and-forget — clear client state regardless
  }
  clearAuthSession();
  // Otherwise a superadmin's "acting as" override survives into the next
  // login on this browser, silently scoping a different account's session.
  clearActiveClientId();
  dispatch(clearActiveClient());
  dispatch(resetFilters());
  dispatch(baseApi.util.resetApiState());
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload || 'Registration failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'idle';
        state.error = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
