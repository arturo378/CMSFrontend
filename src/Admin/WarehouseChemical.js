import React from 'react';
import RecordContext from '../components/RecordContext';
import ChemicalLinesPage from '../components/ChemicalLinesPage';
import { paths } from '../config/routes';
export default function Page() {
 return <RecordContext resource="warehouses" param="warehouseId" back={paths.warehouses} backLabel="Choose a warehouse">{parent => <ChemicalLinesPage key={parent.id} type="warehouse" parent={parent} />}</RecordContext>;
}
