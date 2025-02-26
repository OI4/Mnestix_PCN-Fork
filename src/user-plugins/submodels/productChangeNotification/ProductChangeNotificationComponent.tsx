import { BasicEventElement, Property, SubmodelElementCollection } from '@aas-core-works/aas-core3.0-typescript/types';
import { SubmodelVisualizationProps } from 'app/[locale]/viewer/_components/submodel/SubmodelVisualizationProps';
import { ExpandableDefaultSubmodelDisplay } from 'components/basics/ExpandableNestedContentWrapper';
import { hasSemanticId } from 'lib/util/SubmodelResolverUtil';
import { useEffect, useState } from 'react';
import { MqttDialog } from 'user-plugins/submodels/productChangeNotification/MqttDialog';
import FiberManualRecordIcon from '@mui/icons-material/CheckCircleOutline';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useMqtt } from 'components/contexts/MqttContext';
import { useAsyncEffect } from 'lib/hooks/UseAsyncEffect';

export const ProductChangeNotificationComponent = ({ submodel }: SubmodelVisualizationProps) => {
    const t = useTranslations('user-plugins.submodels.productChangeNotification');
    const [messages, setMessages] = useState<string>('');
    const [addModalOpen, setAddModalOpen] = useState(false);
    const { consumeMessage, subscribe, disconnect, isConnected } = useMqtt();

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

    useEffect(() => {
        subscribe(
            mqttEndpoint!,
            mqttBrokerTopic!,
            'rabbit-user',
            'JvFNXcxtm5AAh3Wj0yry',
        );
        return () => {
            disconnect();
            setMessages('');
        };
    }, []);

    useAsyncEffect(async () => {
        const message = consumeMessage();
        if(message != null){
            await handleMqttMessage(message, setMessages, handleDetailsModalOpen);
        }
    }, [consumeMessage]);

    /*useEffect(() => {
        const connectToMqtt = () => {
            try {
                if (mqttEndpoint == null || mqttBrokerTopic == null) {
                    throw new Error('No mqttBrokerTopic found.');
                }
                const newClient = mqtt.connect(mqttEndpoint, {
                    connectTimeout: 10000,
                    username: 'rabbit-user',
                    password: 'JvFNXcxtm5AAh3Wj0yry',
                    rejectUnauthorized: false,
                });

                newClient.on('connect', () => {
                    console.log('Connected to MQTT Broker');
                    setIsConnected(true);
                    newClient.subscribe(mqttBrokerTopic, (err) => {
                        if (err) {
                            console.error('Error subscribing to topic:', err);
                        } else {
                            console.log(`Subscribed to topic: ${mqttBrokerTopic}`);
                        }
                    });
                    setClient(newClient);
                });
                newClient.on('message', (topic, message) => {
                    const receivedMessage = {
                        topic: topic,
                        message: message.toString(),
                    };
                    console.log('Message recieved: ', receivedMessage);
                    const json = JSON.parse(receivedMessage.message);
                    let url = json.submodel.changeRecord;
                    url = url.replace('[', '%5B').replace(']', '%5D');
                    fetch(url)
                        .then((response) => {
                            console.log(response);
                            if (response.ok) {
                                return response.text();
                            }
                            throw new Error('Error message.');
                        })
                        .then((data) => {
                            const testData = JSON.parse(data);

                            const reasonOfChanges = JSON.stringify(testData?.ReasonsOfChange);

                            const dateOfRecord = testData?.DateOfRecord;
                            const newObj: { DateOfRecord?: string; ReasonOfChange: string } = {
                                ReasonOfChange: reasonOfChanges ?? 'No reason provided ??',
                                DateOfRecord: dateOfRecord ?? 'No date provided',
                            };

                            setMessages(JSON.stringify(newObj));
                            handleDetailsModalOpen();
                        })
                        .catch(function (err) {
                            console.log('failed to load ', json.submodel.changeRecord, err.stack);
                        });
                });

                newClient.on('error', (error) => {
                    console.error('MQTT Error:', error);
                    setIsConnected(false);
                });

                newClient.on('close', () => {
                    console.log('Disconnected from MQTT Broker');
                    setIsConnected(false);
                    setClient(null);
                });
            } catch (error) {
                console.error('Error connecting:', error);
                setIsConnected(false);
            }
        };

        connectToMqtt();

        return () => {
            if (client) {
                client.unsubscribe(mqttBrokerTopic!);
                client.end();
                console.log('MQTT Client Disconnected');
            }
        };
    }, []);*/

    const handleDetailsModalOpen = () => {
        setAddModalOpen(true);
    };

    const handleDetailsModalClose = () => {
        setAddModalOpen(false);
    };

    return (
        <>
            {/*{messages}*/}
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

            <MqttDialog open={addModalOpen} message={messages} onClose={handleDetailsModalClose} />
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
        console.log('Message received:', receivedMessage);

        let url = receivedMessage?.submodel?.changeRecord;
        if (!url) {
            console.error('Invalid message format: Missing \'submodel.changeRecord\'');
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
        const dateOfRecord = parsedData?.DateOfRecord ?? 'No date provided';

        const newObj = {
            ReasonOfChange: reasonOfChanges,
            DateOfRecord: dateOfRecord,
        };

        setMessages(JSON.stringify(newObj));

        // Open modal or trigger UI update
        handleDetailsModalOpen();
    } catch (err) {
        console.error('Failed to process message:', err);
    }
};
