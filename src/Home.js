import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Switch as Switcher, Route, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Drawer, List, IconButton, Typography, Button, Avatar, Menu, MenuItem, Divider, useMediaQuery } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { MainListItems } from './Dashboard/listItems';
import LogoMark from './components/LogoMark';
import ToastProvider from './components/ToastProvider';
import AdminRoute from './components/AdminRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import ClientSwitcher from './components/ClientSwitcher';
import QueryState from './components/QueryState';
import { useConfirmation } from './components/ConfirmationProvider';
import { useAuth } from './config/AuthContext';
import { routeFor } from './config/routes';
import { APP_TITLE } from './config/appInfo';
import { logout } from './store/slices/authSlice';
import { selectSidebarOpen, setSidebar } from './store/slices/uiSlice';
import { selectActiveClientId } from './store/slices/clientContextSlice';
import { baseApi } from './store/api/baseApi';
const UserManagement = React.lazy(() => import('./Admin/UserManagement'));
const LocationManagement = React.lazy(() => import('./Admin/LocationManagement.js'));
const LeaseManagement = React.lazy(() => import('./Admin/LeaseManagement.js'));
const WellManagement = React.lazy(() => import('./Admin/WellManagement.js'));
const WarehouseManagement = React.lazy(() => import('./Admin/WarehouseManagement.js'));
const ChemicalManagement = React.lazy(() => import('./Admin/ChemicalManagement.js'));
const Pricing = React.lazy(() => import('./Admin/Pricing.js'));
const ClientManagement = React.lazy(() => import('./Admin/ClientManagement.js'));
const ShippingPaper = React.lazy(() => import('./WorkOrders/ShippingPapers.js'));
const ShippingChemicals = React.lazy(() => import('./WorkOrders/ShippingChemicals.js'));
const Delivery = React.lazy(() => import('./WorkOrders/Delivery.js'));
const EditDelivery = React.lazy(() => import('./WorkOrders/EditDelivery.js'));
const Main = React.lazy(() => import('./Dashboard/Main'));
const WeeklyEarnings = React.lazy(() => import('./Reports/WeeklyEarnings.js'));
const WarehouseInventory = React.lazy(() => import('./Reports/WarehouseInventory.js'));
const WarehouseChemical = React.lazy(() => import('./Admin/WarehouseChemical.js'));
const UserReport = React.lazy(() => import('./Reports/UserReport.js'));

function Workspace() {
  const theme = useTheme();
  const small = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const { user } = useAuth();
  const location = useLocation();
  const open = useSelector(selectSidebarOpen);
  const clientId = useSelector(selectActiveClientId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const confirmation = useConfirmation();
  const currentRoute = routeFor(location.pathname);
  const displayName = user?.fullname || user?.name || user?.username || 'Account';
  const preferenceKey = 'cms-sidebar:' + (user?.id || 'current');
  useEffect(() => {
    try { const saved = localStorage.getItem(preferenceKey); if (saved !== null) dispatch(setSidebar(saved === 'true')); } catch {}
  }, [dispatch, preferenceKey]);
  useEffect(() => { try { localStorage.setItem(preferenceKey, String(open)); } catch {} }, [open, preferenceKey]);
  useEffect(() => {
    document.title = (currentRoute?.title || 'Page not found') + ' · ' + APP_TITLE;
    setMobileOpen(false);
  }, [location.pathname, currentRoute]);
  const signOut = async () => {
    if (signingOut || !(await confirmation.discard())) return;
    setSigningOut(true);
    await dispatch(logout());
    dispatch(baseApi.util.resetApiState());
  };
  const expanded = small || open;
  return <div className={'app-shell' + (!open ? ' sidebar-collapsed' : '')}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <AppBar position="fixed" color="default" elevation={0} className="workspace-topbar">
      <Toolbar className="workspace-toolbar">
        {(small || !open) && <IconButton aria-label="Open navigation" onClick={() => small ? setMobileOpen(true) : dispatch(setSidebar(true))}><MenuIcon /></IconButton>}
        <Typography component="span" variant="body2" color="textSecondary" className="workspace-section">{currentRoute?.group || 'Workspace'}</Typography>
        <div className="topbar-spacer" />
        <ClientSwitcher />
        <Button aria-label={'Account: ' + displayName} aria-controls={accountAnchor ? 'account-menu' : undefined} aria-haspopup="true" onClick={event => setAccountAnchor(event.currentTarget)} className="account-button">
          <Avatar component="span" className="account-avatar">{displayName.slice(0, 1).toUpperCase()}</Avatar><span className="account-name">{displayName}</span><ExpandMoreIcon fontSize="small" />
        </Button>
        <Menu id="account-menu" anchorEl={accountAnchor} open={Boolean(accountAnchor)} onClose={() => setAccountAnchor(null)}>
          <MenuItem disabled>{displayName} · {user?.role}</MenuItem><Divider />
          <MenuItem onClick={signOut} disabled={signingOut || confirmation.saving}>{signingOut ? 'Signing out…' : 'Sign out'}</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
    <Drawer variant={small ? 'temporary' : 'permanent'} open={small ? mobileOpen : true} onClose={() => setMobileOpen(false)} classes={{ paper: 'workspace-sidebar' }} ModalProps={{ keepMounted: true }}>
      <div className="workspace-brand"><LogoMark size={34} />{expanded && <span>CMS<span className="brand-caption">Operations workspace</span></span>}{!small && open && <IconButton aria-label="Collapse navigation" onClick={() => dispatch(setSidebar(false))}><ChevronLeftIcon /></IconButton>}</div>
      <nav aria-label="Main navigation"><List component="div"><MainListItems isCollapsed={!expanded} /></List></nav>
      {expanded && <div className="sidebar-footer"><span className="workspace-dot" /> Chemical Management System</div>}
    </Drawer>
    <main id="main-content" tabIndex={-1} className="workspace-content" key={(user?.id || '') + ':' + (clientId || 'home')}>
      <ToastProvider />
      <React.Suspense fallback={<QueryState loading />}><Switcher>
          <Route exact path="/">
            <Main></Main>
          </Route>
          <AdminRoute exact path="/usermanagement">
            <UserManagement></UserManagement>
          </AdminRoute>
          <AdminRoute exact path="/locationmanagment">
            <LocationManagement></LocationManagement>
          </AdminRoute>
          <AdminRoute exact path="/locationmanagment/leasemanagment">
            <LeaseManagement></LeaseManagement>
          </AdminRoute>
          <AdminRoute exact path="/locationmanagment/leasemanagment/wellmanagment">
            <WellManagement></WellManagement>
          </AdminRoute>
          <AdminRoute exact path="/warehousemanagement">
            <WarehouseManagement></WarehouseManagement>
          </AdminRoute>
          <AdminRoute exact path="/chemicalmanagement">
            <ChemicalManagement></ChemicalManagement>
          </AdminRoute>
          <AdminRoute exact path="/pricing">
            <Pricing></Pricing>
          </AdminRoute>
          <SuperAdminRoute exact path="/clientmanagement">
            <ClientManagement></ClientManagement>
          </SuperAdminRoute>
          <Route exact path="/shippingpapers">
            <ShippingPaper></ShippingPaper>
          </Route>
          <Route exact path="/shippingchemicals">
            <ShippingChemicals></ShippingChemicals>
          </Route>
          <Route exact path="/delivery">
            <Delivery></Delivery>
          </Route>
          <Route exact path="/delivery/editdelivery">
            <EditDelivery></EditDelivery>
          </Route>
          <Route exact path="/weeklyearnings">
            <WeeklyEarnings></WeeklyEarnings>
          </Route>
          <Route exact path="/warehouseInventory">
            <WarehouseInventory></WarehouseInventory>
          </Route>
          <AdminRoute exact path="/warehousechemical">
            <WarehouseChemical></WarehouseChemical>
          </AdminRoute>
          <Route exact path="/userReport">
            <UserReport></UserReport>
          </Route>

        <Route><QueryState title="Page not found" description="Choose a page from the navigation to continue." to="/" actionLabel="Go to dashboard" /></Route>
      </Switcher></React.Suspense>
    </main>
  </div>;
}
export default function Home() {
  const { confirm } = useConfirmation();
  return <Router getUserConfirmation={(message, callback) => { confirm({ title: 'Leave unsaved changes?', message, confirmLabel: 'Discard changes', danger: true }).then(callback); }}><Workspace /></Router>;
}
