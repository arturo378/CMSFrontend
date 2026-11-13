import React, { useContext, useEffect, useRef } from 'react';
import { Breadcrumbs, Typography, Link as MuiLink } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { __RouterContext } from 'react-router';
import { routeFor } from '../config/routes';
export default function PageTitle({ children, description, breadcrumbs, actions }) {
  const router = useContext(__RouterContext);
  const route = routeFor(router?.location.pathname || '/');
  const parent = route?.parent && routeFor(route.parent);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const crumbs = breadcrumbs || (parent ? [{ label: parent.title, to: parent.path }] : []);
  return <header className="page-header">
    <div className="page-heading">
      {crumbs.length > 0 ? <Breadcrumbs aria-label="Breadcrumb" className="page-breadcrumbs">
        {crumbs.map((crumb, i) => crumb.to ? <MuiLink key={i} component={Link} to={crumb.to} color="inherit">{crumb.label}</MuiLink> : <Typography key={i} color="textSecondary" variant="body2">{crumb.label}</Typography>)}
        <Typography color="textPrimary" variant="body2">{children}</Typography>
      </Breadcrumbs> : <span className="page-eyebrow">{route?.group || 'Workspace'}</span>}
      <Typography variant="h4" component="h1" tabIndex={-1} ref={heading}>{children}</Typography>
      {(description || route?.description) && <Typography color="textSecondary" variant="body2" className="page-description">{description || route.description}</Typography>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>;
}
