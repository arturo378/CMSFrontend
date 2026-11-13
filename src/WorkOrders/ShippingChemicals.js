import React from 'react';
import RecordContext from '../components/RecordContext';
import ChemicalLinesPage from '../components/ChemicalLinesPage';
import { paths } from '../config/routes';
export default function Page() {
 return <RecordContext resource="shipping-papers" param="shippingPaperId" back={paths.shipping} backLabel="Choose a shipping paper">{parent => <ChemicalLinesPage key={parent.id} type="shipping" parent={parent} />}</RecordContext>;
}
