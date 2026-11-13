// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

// The PDF library probes canvas at import time; export behavior is tested at
// the export boundary rather than depending on a browser canvas in jsdom.
jest.mock('jspdf', () => jest.fn());

// The older accessibility-name helper asks for pseudo-element styles, which
// jsdom does not implement. Keep normal computed styles for role queries.
const computedStyle = window.getComputedStyle;
window.getComputedStyle = element => computedStyle(element);
