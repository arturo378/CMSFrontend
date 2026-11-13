import React from 'react';
import { Chip } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import ResourcePage from '../components/ResourcePage';
import { useConfirmation } from '../components/ConfirmationProvider';
import { useAuth } from '../config/AuthContext';
import { ROLES, assignableRoles } from '../config/permissions';
import { showToast } from '../store/slices/uiSlice';
import { useGetUsersQuery, useAddUserMutation, useUpdateUserMutation, useResetUserPasswordMutation, useDeactivateUserMutation } from '../store/api/usersApi';
export default function UserManagement() {
  const { user } = useAuth(); const { confirm } = useConfirmation(); const dispatch = useDispatch();
  const query = useGetUsersQuery({ limit: 100 });
  const [add] = useAddUserMutation(); const [update] = useUpdateUserMutation(); const [reset] = useResetUserPasswordMutation(); const [deactivate] = useDeactivateUserMutation();
  const roles = assignableRoles(user?.role);
  const fields = row => [
    { name: 'username', label: 'Username', required: true },
    { name: 'fullname', label: 'Full name', required: true, defaultValue: row?.name || '' },
    { name: 'email', label: 'Email', type: 'email', required: true, disabled: Boolean(row), wide: true },
    { name: 'role', label: 'Role', type: 'select', defaultValue: ROLES.USER, required: true, options: [...new Set([...roles, ...(row?.role ? [row.role] : [])])].map(role => ({ value: role, label: role === ROLES.SUPERADMIN ? 'Superadmin' : role === ROLES.ADMIN ? 'Admin' : 'User' })), disabled: row && !roles.includes(row.role), omit: row && !roles.includes(row.role) },
    ...(!row ? [{ name: 'password', label: 'Password', type: 'password', minLength: 8, required: true, autoComplete: 'new-password' }, { name: 'confirmPassword', label: 'Confirm password', type: 'password', matches: 'password', required: true, omit: true, autoComplete: 'new-password' }] : []),
  ];
  return <ResourcePage title="Users" query={query} fields={fields} createLabel="Add user" columns={[
    { title: 'Name', field: 'fullname', render: row => row.fullname || row.name || row.username }, { title: 'Username', field: 'username' }, { title: 'Email', field: 'email' }, { title: 'Role', field: 'role' },
    { title: 'Status', field: 'status', render: row => <Chip size="small" label={row.status === 'inactive' ? 'Inactive' : 'Active'} variant="outlined" /> },
  ]} onSave={(values, row) => (row ? update({ ...values, name: values.fullname, id: row.id }) : add({ ...values, name: values.fullname })).unwrap()}
    rowActions={[
      { label: 'Send reset code', onClick: async row => {
        if (await confirm({ title: 'Email a password reset code?', message: 'A reset code will be sent to ' + row.email + '. It expires in 10 minutes.', confirmLabel: 'Send reset code' })) { await reset(row.id).unwrap(); dispatch(showToast({ severity: 'success', message: 'Password reset code sent' })); }
      } },
      row => ({ label: row.status === 'inactive' ? 'Reactivate' : 'Deactivate', onClick: async selected => {
        const inactive = selected.status === 'inactive';
        if (await confirm({ title: (inactive ? 'Reactivate ' : 'Deactivate ') + (selected.fullname || selected.name || selected.username) + '?', message: inactive ? 'This user will be able to sign in again.' : 'This user will be signed out and unable to sign in.', confirmLabel: inactive ? 'Reactivate user' : 'Deactivate user', danger: !inactive })) { await (inactive ? update({ id: selected.id, status: 'active' }) : deactivate(selected.id)).unwrap(); dispatch(showToast({ severity: 'success', message: 'User status updated' })); }
      } }),
    ]} />;
}
