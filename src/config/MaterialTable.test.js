import React from 'react';
import { render } from '@testing-library/react';
import MaterialTable from './MaterialTable';

// PDF export is unrelated to rendering and requires canvas support in jsdom.
jest.mock('jspdf', () => jest.fn());

test('renders shared User and Lease Management table options without prop-type warnings', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  try {
    const { unmount } = render(
      <MaterialTable
        title="Users"
        columns={[{ title: 'Username', field: 'username' }]}
        data={[]}
        options={{
          pageSize: 10,
          pageSizeOptions: [5, 10, 20],
          search: false,
          actionsColumnIndex: -1,
        }}
      />
    );

    unmount();
    expect(consoleError).not.toHaveBeenCalled();
  } finally {
    consoleError.mockRestore();
  }
});
