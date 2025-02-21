import { submodelElementCollectionFromJsonable } from '@aas-core-works/aas-core3.0-typescript/jsonization';
import { BasicEventElement, Property, SubmodelElementCollection } from '@aas-core-works/aas-core3.0-typescript/types';
import { SubmodelVisualizationProps } from 'app/[locale]/viewer/_components/submodel/SubmodelVisualizationProps';
import { ExpandableDefaultSubmodelDisplay } from 'components/basics/ExpandableNestedContentWrapper';
import { hasSemanticId } from 'lib/util/SubmodelResolverUtil';
import mqtt, { MqttClient } from 'mqtt';
import { useEffect, useState } from 'react';
import { MqttDialog } from 'user-plugins/submodels/productChangeNotification/MqttDialog';

export const ProductChangeNotificationComponent = ({ submodel }: SubmodelVisualizationProps) => {
    const [messages, setMessages] = useState<string>('');
    const [client, setClient] = useState<MqttClient | null>(null);
    const [, setIsConnected] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);

    const event = submodel.submodelElements!.find((el) =>
        hasSemanticId(el, 'http://admin-shell.io/VDMA/Fluidics/ProductChangeNotification/EventsOutgoing/1/0'),
    );
    const records = submodel.submodelElements!.find((el) =>
        hasSemanticId(el, 'http://admin-shell.io/VDMA/Fluidics/ProductChangeNotification/Record/List/1/0'),
    );

    const mqttBrokerTopic = (event as BasicEventElement).messageTopic;
    //const mqttEndpointCollection = submodel.submodelElements!.find((el) => el.idShort == 'BrokerInformation');
    //const mqttEndpoint = (
    //    (mqttEndpointCollection as SubmodelElementCollection).value?.find(
    //        (el) => el.idShort === 'EndpointWss',
    //    ) as Property
    //).value;

    useEffect(() => {
        const connectToMqtt = () => {
            try {
                const newClient = mqtt.connect('ws://pcn-hackathon.westeurope.cloudapp.azure.com:15675/ws', {
                    connectTimeout: 10000,
                    username: 'rabbit-user',
                    password: 'JvFNXcxtm5AAh3Wj0yry',
                    rejectUnauthorized: false,
                });

                newClient.on('connect', () => {
                    console.log('Connected to MQTT Broker');
                    setIsConnected(true);
                    newClient.subscribe(mqttBrokerTopic!, (err) => {
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
                            const testdata = JSON.parse(data);
                            const parsedModel = submodelElementCollectionFromJsonable(testdata);
                            const jsonCollection = parsedModel.value;

                            const reasonOfChanges = (
                                jsonCollection?.value?.find(
                                    (sme) => sme.idShort === 'ReasonsOfChange',
                                ) as SubmodelElementCollection
                            )?.value;
                            const dateOfRecord = (
                                jsonCollection?.value?.find((sme) => sme.idShort === 'DateOfRecord') as Property
                            )?.value;
                            const newObj: { DateOfRecord?: string; ReasonOfChange: string } = {
                                ReasonOfChange:
                                    (reasonOfChanges?.find((sme) => sme.idShort === 'ReasonOfChange') as Property)
                                        ?.value ?? 'No reason provided',
                                DateOfRecord: dateOfRecord ?? 'No date provided',
                            };
                            setMessages(JSON.stringify(newObj));
                        })
                        .catch(function (err) {
                            console.log('failed to load ', json.submodel.changeRecord, err.stack);
                        });
                    setMessages(receivedMessage.message);
                    handleDetailsModalOpen();
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
    }, []);

    const handleDetailsModalOpen = () => {
        setAddModalOpen(true);
    };

    const handleDetailsModalClose = () => {
        setAddModalOpen(false);
    };

    return (
        <>
            {messages}

            <MqttDialog open={addModalOpen} message={messages} onClose={handleDetailsModalClose} />

            {/*<EventDisplay event={event as BasicEventElement} />*/}
            {/*<RecordsDisplay records={records as SubmodelElementCollection} />*/}
            <ExpandableDefaultSubmodelDisplay submodel={submodel} />
        </>
    );
};
