import { Accordion, AccordionDetails, AccordionSummary, List, ListItem, Typography } from '@mui/material';
import {
    ISubmodelElement,
    KeyTypes,
    SubmodelElementCollection,
    SubmodelElementList,
} from '@aas-core-works/aas-core3.0-typescript/types';
import { getKeyType } from 'lib/util/KeyTypeUtil';
import { MultiLanguageProperty, Property } from '@aas-core-works/aas-core3.0-typescript/dist/types/types';
import { PropertyComponent } from 'app/[locale]/viewer/_components/submodel-elements/generic-elements/PropertyComponent';
import { MultiLanguagePropertyComponent } from 'app/[locale]/viewer/_components/submodel-elements/generic-elements/MultiLanguagePropertyComponent';

type RecordsDisplayProps = {
    records: SubmodelElementCollection | SubmodelElementList;
};
const RecordsDisplay = ({ records }: RecordsDisplayProps) => {
    return (
        <>
            {(records as SubmodelElementCollection)?.value?.map((el, index) => (
                <RecursiveRenderer element={el} key={index} />
            ))}
        </>
    );
};

type RecursiveRendererProps = {
    element: ISubmodelElement;
};

const RecursiveRenderer = ({ element }: RecursiveRendererProps) => {
    if (element === null) return <Typography>null</Typography>;

    const getRecordType = getKeyType(element);

    if (getRecordType === KeyTypes.Property) {
        return <PropertyComponent property={element as Property} />;
    }

    if (getRecordType === KeyTypes.MultiLanguageProperty) {
        return <MultiLanguagePropertyComponent mLangProp={element as MultiLanguageProperty} />;
    }

    if (getRecordType === KeyTypes.SubmodelElementCollection || getRecordType === KeyTypes.SubmodelElementList) {
        return (
            <Accordion>
                <AccordionSummary>
                    <Typography variant="subtitle1">{element.idShort}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <List>
                        {(element as SubmodelElementCollection)?.value?.map((el, index) => (
                            <ListItem key={index}>
                                <RecursiveRenderer element={el} />
                            </ListItem>
                        ))}
                    </List>
                </AccordionDetails>
            </Accordion>
        );
    }

    return null;
};

export default RecordsDisplay;
