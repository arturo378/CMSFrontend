import React from 'react';
import RecordContext from '../components/RecordContext';
import ChemicalLinesPage from '../components/ChemicalLinesPage';
import { paths } from '../config/routes';
export default function Page() {
 return <RecordContext resource="deliveries" param="deliveryId" back={paths.deliveries} backLabel="Choose a delivery">{parent => <ChemicalLinesPage key={parent.id} type="delivery" parent={parent} />}</RecordContext>;
}
