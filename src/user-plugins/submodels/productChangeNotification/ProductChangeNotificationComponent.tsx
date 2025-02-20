import { useTranslations } from 'next-intl';
import { SubmodelVisualizationProps } from 'app/[locale]/viewer/_components/submodel/SubmodelVisualizationProps';
import { ExpandableDefaultSubmodelDisplay } from 'components/basics/ExpandableNestedContentWrapper';
import EventDisplay from 'user-plugins/submodels/productChangeNotification/EventDisplay';
import { hasSemanticId } from 'lib/util/SubmodelResolverUtil';
import { BasicEventElement } from '@aas-core-works/aas-core3.0-typescript/dist/types/types';
import RecordsDisplay from 'user-plugins/submodels/productChangeNotification/RecordsDisplay';
import { SubmodelElementCollection } from '@aas-core-works/aas-core3.0-typescript/types';

export const ProductChangeNotificationComponent = ({ submodel }: SubmodelVisualizationProps) => {
    const t = useTranslations('user-plugins.submodels.hello-world-component');
    const event = submodel.submodelElements!.find((el) =>
        hasSemanticId(el, 'http://admin-shell.io/VDMA/Fluidics/ProductChangeNotification/EventsOutgoing/1/0'),
    );
    const records = submodel.submodelElements!.find((el) =>
        hasSemanticId(el, 'http://admin-shell.io/VDMA/Fluidics/ProductChangeNotification/Record/List/1/0'),
    );

    return (
        <>
            <EventDisplay event={event as BasicEventElement} />
            <RecordsDisplay records={records as SubmodelElementCollection} />
            <ExpandableDefaultSubmodelDisplay submodel={submodel} />
        </>
    );
};
