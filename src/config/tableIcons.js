import AddBox from '@material-ui/icons/AddBox';
import Check from '@material-ui/icons/Check';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Edit from '@material-ui/icons/Edit';
import SaveAlt from '@material-ui/icons/SaveAlt';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import Refresh from '@material-ui/icons/Refresh';
import Search from '@material-ui/icons/Search';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Remove from '@material-ui/icons/Remove';
import ViewColumn from '@material-ui/icons/ViewColumn';

// SVG icons avoid a remote icon-font dependency for core table controls.
const tableIcons = { Add: AddBox, Check: Check, Clear: Clear, Delete: DeleteOutline, DetailPanel: ChevronRight, Edit: Edit, Export: SaveAlt, Filter: FilterList, FirstPage: FirstPage, LastPage: LastPage, NextPage: ChevronRight, PreviousPage: ChevronLeft, Refresh: Refresh, ResetSearch: Clear, Search: Search, SortArrow: ArrowDownward, ThirdStateCheck: Remove, ViewColumn: ViewColumn };
export default tableIcons;
