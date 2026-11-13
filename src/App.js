import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import './App.css';
import { AuthProvider } from './config/AuthContext';
import Login from './Login';
import Home from './Home';
import { APP_TITLE } from './config/appInfo';
import { selectIsAuthenticated } from './store/slices/authSlice';
import { ThemeProvider, CssBaseline } from '@material-ui/core';
import theme from './config/theme';
import { ConfirmationProvider } from './components/ConfirmationProvider';

export default function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) document.title = APP_TITLE;
  }, [isAuthenticated]);

  return (
    <ThemeProvider theme={theme}>
    <CssBaseline />
    <ConfirmationProvider>
    <div className="App">
      {isAuthenticated ? (
        <AuthProvider>
          <Home />
        </AuthProvider>
      ) : (
        <Login />
      )}
    </div>
    </ConfirmationProvider>
    </ThemeProvider>
  );
}
