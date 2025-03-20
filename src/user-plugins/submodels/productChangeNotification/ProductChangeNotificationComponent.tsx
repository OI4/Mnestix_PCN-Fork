import { BasicEventElement, Property, SubmodelElementCollection } from '@aas-core-works/aas-core3.0-typescript/types';
import { SubmodelVisualizationProps } from 'app/[locale]/viewer/_components/submodel/SubmodelVisualizationProps';
import { ExpandableDefaultSubmodelDisplay } from 'components/basics/ExpandableNestedContentWrapper';
import { hasSemanticId } from 'lib/util/SubmodelResolverUtil';
import { useEffect } from 'react';
import FiberManualRecordIcon from '@mui/icons-material/CheckCircleOutline';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useMqtt } from 'components/contexts/MqttContext';
import { useEnv } from 'app/env/provider';

export const ProductChangeNotificationComponent = ({ submodel }: SubmodelVisualizationProps) => {
    const t = useTranslations('user-plugins.submodels.productChangeNotification');
    const { client, subscribe, isConnected } = useMqtt();

    const event = submodel.submodelElements!.find((el) =>
        hasSemanticId(el, 'http://admin-shell.io/VDMA/Fluidics/ProductChangeNotification/EventsOutgoing/1/0'),
    );
    submodel.submodelElements!.find((el) =>
        hasSemanticId(el, 'http://admin-shell.io/VDMA/Fluidics/ProductChangeNotification/Record/List/1/0'),
    );
    const mqttBrokerTopic = (event as BasicEventElement).messageTopic;
    const mqttEndpointCollection = submodel.submodelElements!.find((el) => el.idShort == 'BrokerInformation');
    const mqttEndpoint = (
        (mqttEndpointCollection as SubmodelElementCollection).value?.find(
            (el) => el.idShort === 'EndpointWss',
        ) as Property
    ).value;
    const env = useEnv();

    useEffect(() => {
        if (!client && !isConnected) {
            subscribe(mqttEndpoint!, mqttBrokerTopic!, env.MQTT_LOGIN, env.MQTT_PASSWORD);
        }
    }, []);

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Grid container alignItems="center" spacing={1} justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h4" component="h5" gutterBottom>
                            {t('connected')}
                        </Typography>
                    </Grid>
                    <Grid item>
                        {' '}
                        <FiberManualRecordIcon sx={{ color: isConnected ? 'green' : 'red', fontSize: '1.2rem' }} />
                    </Grid>
                </Grid>

                <Grid container alignItems="center" spacing={1} justifyContent="space-between">
                    <Grid item xs>
                        <Typography variant="h4" component="h5" gutterBottom>
                            {t('subscribed')}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Typography variant="body1">{mqttBrokerTopic}</Typography>
                    </Grid>
                </Grid>
            </Box>

            <ExpandableDefaultSubmodelDisplay submodel={submodel} />
        </>
    );
};

export const handleMqttMessage = async (
    message: string,
    setMessages: (msg: string) => void,
    handleDetailsModalOpen: () => void,
) => {
    try {
        const receivedMessage = JSON.parse(message);

        let url = receivedMessage?.submodel?.changeRecord;
        if (!url) {
            console.error('Invalid message format: Missing submodel.changeRecord');
            return;
        }

        url = url.replace('[', '%5B').replace(']', '%5D');

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.text();
        const parsedData = JSON.parse(data);

        const reasonOfChanges = JSON.stringify(parsedData?.ReasonsOfChange) ?? 'No reason provided';
        const pcnChangeInformation =
            JSON.stringify(parsedData?.PcnChangeInformation) ?? 'No Change Information Provided';
        const dateOfRecord = parsedData?.DateOfRecord ?? 'No date provided';

        const newObj = {
            ReasonOfChange: reasonOfChanges,
            DateOfRecord: dateOfRecord,
            PcnChangeInformation: pcnChangeInformation,
        };

        setMessages(JSON.stringify(newObj));

        // Open modal or trigger UI update
        handleDetailsModalOpen();
    } catch (err) {
        console.error('Failed to process message:', err);
    }
};
