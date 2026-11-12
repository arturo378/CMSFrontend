const fs = require('fs');
const path = require('path');

// material-table 1.63.0 uses bitwise OR instead of oneOfType, producing a
// number where React expects a validator. Keep the remaining options intact.
const propTypesPath = require.resolve('material-table/dist/prop-types');
const source = fs.readFileSync(propTypesPath, 'utf8');
const patched = source.replace(
  'defaultExpanded: _propTypes["default"].bool | _propTypes["default"].func',
  'defaultExpanded: _propTypes["default"].oneOfType([_propTypes["default"].bool, _propTypes["default"].func])'
);

// Safe to rerun; newer versions with a corrected validator need no change.
if (patched !== source) {
  fs.writeFileSync(propTypesPath, patched);

  // Webpack treats node_modules as immutable and can otherwise keep serving
  // the old validator even after the dependency file has been corrected.
  const cacheRoot = path.resolve(__dirname, '../node_modules/.cache');
  for (const cacheName of ['default-development', 'default-production']) {
    fs.rmSync(path.join(cacheRoot, cacheName), { recursive: true, force: true });
  }

  console.log('Patched material-table defaultExpanded prop-type validator.');
}
