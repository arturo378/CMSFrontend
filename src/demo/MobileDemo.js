import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DEMO_MODE, DEMO_USER } from '../config/demoMode';
import { selectActiveClientId } from '../store/slices/clientContextSlice';
import { baseApi } from '../store/api/baseApi';
import { resetDemoData } from './api';
import { getMobileDemoSession, handleMobileRequest } from './mobileBridge';
import './MobileDemo.css';

export default function MobileDemo() {
  const iframe = useRef(null);
  const dispatch = useDispatch();
  const client = useSelector(selectActiveClientId) || DEMO_USER.client;
  const [ready, setReady] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [activity, setActivity] = useState('Create a shipping paper to begin.');
  const [attempt, setAttempt] = useState(0);
  const configuredUrl = process.env.REACT_APP_MOBILE_DEMO_URL || 'https://cms-mobile-app.vercel.app/dashboard';
  const src = useMemo(() => {
    if (!configuredUrl) return '';
    try {
      const url = new URL(configuredUrl);
      if (!['http:', 'https:'].includes(url.protocol)) return '';
      url.searchParams.set('embedOrigin', window.location.origin);
      url.searchParams.set('client', client);
      url.searchParams.set('session', getMobileDemoSession());
      return url.toString();
    } catch { return ''; }
  }, [configuredUrl, client]);

  useEffect(() => {
    if (!DEMO_MODE || !src) return undefined;
    const origin = new URL(src).origin;
    setReady(false); setWaiting(false);
    const timeout = setTimeout(() => setWaiting(true), 10000);
    const receive = async (event) => {
      if (event.source !== iframe.current?.contentWindow || event.origin !== origin || event.data?.source !== 'cms-mobile-demo') return;
      const message = event.data;
      if (message.type === 'reset') {
        resetDemoData();
        window.location.assign('/mobile-demo');
        return;
      }
      if (message.type !== 'request' || typeof message.id !== 'string') return;
      clearTimeout(timeout); setReady(true); setWaiting(false);
      const reply = { source: 'cms-demo-host', id: message.id };
      try {
        reply.result = await handleMobileRequest(message, client);
        if (message.method !== 'GET') {
          dispatch(baseApi.util.invalidateTags(['ShippingPaper', 'ShippingChemical', 'Delivery', 'DeliveryChemical', 'WarehouseChemical', 'Dashboard', 'Report']));
          if (message.method === 'POST' && message.path === '/api/shipping-papers') setActivity(`Shipping paper ${reply.result.datanumber} created.`);
          if (message.method === 'POST' && message.path === '/api/deliveries') setActivity(`Delivery ${reply.result.datanumber} recorded.`);
          if (message.method === 'PUT' && message.path.startsWith('/api/shipping-papers/')) setActivity('Shipment closed. Remaining chemicals returned to the destination warehouse.');
        }
      } catch (error) { reply.error = { message: error.message || 'Demo request failed', status: error.status || 400 }; }
      event.source.postMessage(reply, origin);
    };
    window.addEventListener('message', receive);
    return () => { clearTimeout(timeout); window.removeEventListener('message', receive); };
  }, [src, client, dispatch, attempt]);

  if (!DEMO_MODE) return null;
  return <div className="mobile-showcase">
    <section className="mobile-showcase-copy">
      <span className="mobile-showcase-eyebrow">CMS FIELD APP</span>
      <h2>From the warehouse<br /> to the well.</h2>
      <p className="mobile-showcase-lead">Try the field team's daily workflow. Every shipment and delivery you create here appears in this CMS demo.</p>
      <ol className="mobile-showcase-steps">
        <li><strong>Load the truck</strong><span>Create a shipping paper, choose two warehouses, and add chemicals.</span></li>
        <li><strong>Make a delivery</strong><span>Select a company, lease, and well. Record the gallons delivered.</span></li>
        <li><strong>Close the shipment</strong><span>Return the remaining chemicals to the destination warehouse.</span></li>
      </ol>
      <div className="mobile-showcase-activity" role="status"><span className={ready ? 'demo-status-dot connected' : 'demo-status-dot'} />{ready ? activity : 'Connecting to the mobile demo…'}</div>
      <div className="mobile-showcase-links"><Link to="/shippingpapers">View shipping papers →</Link><Link to="/delivery">View deliveries →</Link></div>
      <p className="mobile-showcase-note">Sample data only. GPS uses a sample Midland location. Reset demo restores the starting data.</p>
    </section>
    <section className="mobile-showcase-device" aria-label="Interactive mobile app">
      <div className="demo-phone">
        <div className="demo-phone-hardware" aria-hidden="true">
          <span className="demo-phone-speaker" />
          <span className="demo-phone-button demo-phone-silent" />
          <span className="demo-phone-button demo-phone-volume-up" />
          <span className="demo-phone-button demo-phone-volume-down" />
          <span className="demo-phone-button demo-phone-power" />
        </div>
        <div className="demo-phone-screen">
          <div className="demo-phone-status" aria-hidden="true">
            <span className="demo-phone-time">9:41</span>
            <span className="demo-phone-island"><span className="demo-phone-camera" /></span>
            <span className="demo-phone-indicators">
              <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor"><rect x="0" y="9" width="3" height="5" rx="0.8" /><rect x="4.3" y="6" width="3" height="8" rx="0.8" /><rect x="8.6" y="3" width="3" height="11" rx="0.8" /><rect x="12.9" width="3" height="14" rx="0.8" /></svg>
              <svg width="16" height="14" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 4.5a12 12 0 0 1 16 0M5 8a7.5 7.5 0 0 1 10 0M8 11.5a3 3 0 0 1 4 0" /><circle cx="10" cy="14" r="1" fill="currentColor" stroke="none" /></svg>
              <svg width="25" height="13" viewBox="0 0 27 14" fill="none"><rect x="0.7" y="1" width="22" height="12" rx="3" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.2" /><rect x="3" y="3.3" width="17.5" height="7.4" rx="1.3" fill="currentColor" /><path d="M24.3 4.5v5c2.6-.6 2.6-4.4 0-5Z" fill="currentColor" fillOpacity="0.5" /></svg>
            </span>
          </div>
          {src ? <iframe key={`${client}-${attempt}`} ref={iframe} src={src} title="CMS mobile app demo" />
            : <div className="mobile-showcase-unavailable">The mobile demo hasn't been configured for this deployment.</div>}
          <div className="demo-phone-home" aria-hidden="true"><span /></div>
        </div>
      </div>
      {waiting && <div className="mobile-showcase-unavailable" role="alert">The mobile app hasn't connected. Check your connection and try again. <button onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>}
      {configuredUrl && <a className="mobile-showcase-open" href={configuredUrl} target="_blank" rel="noopener noreferrer">Open standalone demo ↗</a>}
    </section>
  </div>;
}
