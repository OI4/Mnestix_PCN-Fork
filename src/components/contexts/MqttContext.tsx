import React, { createContext, useContext, useRef, useState } from 'react';
import mqtt, { MqttClient } from 'mqtt';

// Define the context type
interface MqttContextType {
    consumeMessage: () => string | null;
    subscribe: (brokerUrl: string, topic: string, userName?: string, password?: string) => void;
    disconnect: () => void;
    isConnected: boolean;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const clientRef = useRef<MqttClient | null>(null);
    const [contextMessage, setContextMessage] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentTopic, setCurrentTopic] = useState<string | null>(null);
    const [currentBrokerUrl, setCurrentBrokerUrl] = useState<string | null>(null);

    const subscribe = (brokerUrl: string, topic: string, userName?: string, password?: string) => {
        if (clientRef.current && isConnected && currentBrokerUrl === brokerUrl && currentTopic === topic) {
            console.log('Already connected to this topic');
            return;
        }

        disconnect();

        clientRef.current = mqtt.connect(brokerUrl, {
            connectTimeout: 10000,
            username: userName,
            password: password,
            rejectUnauthorized: false,
        });

        clientRef.current.on('connect', () => {
            console.log('Connected to MQTT Broker');
            clientRef.current?.subscribe(topic, (err) => {
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

        clientRef.current.on('message', (receivedTopic, payload) => {
            if (receivedTopic === topic) {
                const message = payload.toString();
                console.log(`Message received on ${topic}: ${message}`);
                setContextMessage(message);
            }
        });

        clientRef.current.on('error', (error) => {
            console.error('MQTT Error:', error);
            setIsConnected(false);
        });

        clientRef.current.on('close', () => {
            console.log('Disconnected from MQTT Broker');
            setIsConnected(false);
            clientRef.current = null;
        });
    };

    const disconnect = () => {
        if (clientRef.current && currentTopic) {
            console.log(`Unsubscribing from topic: ${currentTopic}`);
            clientRef.current.unsubscribe(currentTopic, () => {
                console.log('Unsubscribed successfully');
            });
            clientRef.current.end();
            clientRef.current = null;
            setIsConnected(false);
            setCurrentTopic(null);
            setCurrentBrokerUrl(null);
            setContextMessage(null);
        }
    };

    const consumeMessage = () => {
        const message = contextMessage;
        setContextMessage(null);
        return message;
    };

    return (
        <MqttContext.Provider value={{ consumeMessage, subscribe, disconnect, isConnected }}>
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
