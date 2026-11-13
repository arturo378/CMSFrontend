import { createTheme } from '@material-ui/core/styles';

export default createTheme({
  palette: {
    primary: { main: '#2563eb', dark: '#1d4ed8' }, secondary: { main: '#475569' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569' }, divider: '#e2e8f0',
    error: { main: '#b91c1c' }, warning: { main: '#92400e' }, success: { main: '#166534' },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.035em' },
    h5: { fontSize: '1.35rem', fontWeight: 650 }, h6: { fontSize: '1.05rem', fontWeight: 650 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  props: { MuiButton: { disableElevation: true }, MuiTextField: { variant: 'outlined' } },
  overrides: {
    MuiButton: { root: { minHeight: 40 }, sizeSmall: { minHeight: 36 } },
    MuiPaper: { rounded: { borderRadius: 12 }, elevation2: { boxShadow: '0 2px 8px rgba(15,23,42,.04)' } },
    MuiTableCell: { head: { background: '#f8fafc', color: '#475569', fontWeight: 650, borderBottom: '1px solid #e2e8f0' }, body: { borderBottom: '1px solid #f1f5f9', fontSize: 14 } },
    MuiDialog: { paper: { maxHeight: 'calc(100% - 32px)' }, paperWidthSm: { width: '100%' } },
    MuiDialogTitle: { root: { padding: '24px 24px 16px' } },
    MuiDialogActions: { root: { padding: '16px 24px', borderTop: '1px solid #e2e8f0' } },
    MuiTooltip: { tooltip: { fontSize: 12 } },
    MuiOutlinedInput: { notchedOutline: { borderColor: '#64748b' } },
  },
});
