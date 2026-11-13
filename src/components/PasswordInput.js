import React, { useState } from 'react';
import { FormControl } from 'react-bootstrap';
export default function PasswordInput({ label = 'password', ...props }) {
  const [visible, setVisible] = useState(false);
  return <div className="password-input"><FormControl {...props} type={visible ? 'text' : 'password'} /><button type="button" className="password-toggle" aria-label={(visible ? 'Hide ' : 'Show ') + label} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? 'Hide' : 'Show'}</button></div>;
}
