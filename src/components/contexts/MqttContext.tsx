import React, { createContext, useContext, useEffect, useState } from 'react';
import mqtt, { MqttClient } from 'mqtt';

let globalClient: MqttClient | null = null;
// Define the context type
interface MqttContextType {
    client: MqttClient | null;
    consumeMessage: () => string | null;
    subscribe: (brokerUrl: string, topic: string, userName?: string, password?: string) => void;
    disconnect: () => void;
    isConnected: boolean;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [contextMessage, setContextMessage] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentTopic, setCurrentTopic] = useState<string | null>(null);
    const [currentBrokerUrl, setCurrentBrokerUrl] = useState<string | null>(null);

    const subscribeMqtt = (brokerUrl: string, topic: string, userName?: string, password?: string) => {
        if (globalClient && isConnected && currentBrokerUrl === brokerUrl && currentTopic === topic) {
            console.log('Already connected to this topic');
            return;
        }

        disconnectMqtt(() => {
            globalClient = mqtt.connect(brokerUrl, {
                connectTimeout: 10000,
                username: userName,
                password: password,
                rejectUnauthorized: false,
            });

            globalClient.on('connect', () => {
                console.log('Connected to MQTT Broker');
                globalClient?.subscribe(topic, (err) => {
                    if (err) {
                        console.error('Subscription error:', err);
                    } else {
                        console.log(`Subscribed to topic: ${topic}`);
                        setCurrentTopic(topic);
                        setCurrentBrokerUrl(brokerUrl);
                        setIsConnected(true);
                    }
                });
            });

            globalClient.on('message', (receivedTopic, payload) => {
                if (receivedTopic === topic) {
                    const message = payload.toString();
                    setContextMessage(message);
                }
            });

            globalClient.on('error', (error) => {
                console.error('MQTT Error:', error);
                setIsConnected(false);
            });

            globalClient.on('close', () => {
                console.log('Disconnected from MQTT Broker');
                setIsConnected(false);
                globalClient = null;
            });
        });
    };

    const disconnectMqtt = (callback?: () => void) => {
        if (globalClient) {
            if (currentTopic) {
                console.log(`Unsubscribing from topic: ${currentTopic}`);
                globalClient.unsubscribe(currentTopic, (err) => {
                    if (err) {
                        console.error('Unsubscribe error:', err);
                    } else {
                        console.log('Unsubscribed successfully');
                    }
                });
            }

            globalClient.end(false, () => {
                console.log('MQTT client disconnected');
                globalClient = null;
                setIsConnected(false);
                setCurrentTopic(null);
                setCurrentBrokerUrl(null);
                setContextMessage(null);
                if (callback) callback();
            });
        } else if (callback) {
            callback();
        }
    };

    const consumeMessage = () => {
        const message = contextMessage;
        setContextMessage(null);
        return message;
    };

    useEffect(() => {
        return () => {
            disconnectMqtt();
        };
    }, []);

    return (
        <MqttContext.Provider
            value={{
                client: globalClient,
                consumeMessage,
                subscribe: subscribeMqtt,
                disconnect: disconnectMqtt,
                isConnected,
            }}
        >
            {children}
        </MqttContext.Provider>
    );
};

export const useMqtt = () => {
    const context = useContext(MqttContext);
    if (!context) {
        throw new Error('useMqtt must be used within an MqttProvider');
    }
    return context;
};
