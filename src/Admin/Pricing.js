import React from 'react';
import RecordContext from '../components/RecordContext';
import ChemicalLinesPage from '../components/ChemicalLinesPage';
import { paths } from '../config/routes';
export default function Page() {
 return <RecordContext resource="companies" param="companyId" back={paths.locations} backLabel="Choose a company">{parent => <ChemicalLinesPage key={parent.id} type="pricing" parent={parent} />}</RecordContext>;
}
