'use client';

import { Box } from '@mui/material';
import { CurrentAasContextProvider } from 'components/contexts/CurrentAasContext';
import { NotificationContextProvider } from 'components/contexts/NotificationContext';
import { LayoutRoot } from 'layout/LayoutRoot';
import { CustomThemeProvider } from 'layout/theme/CustomThemeProvider';
import { Internationalization } from 'lib/i18n/Internationalization';
import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { EnvProvider } from 'app/env/provider';
import { MqttProvider } from 'components/contexts/MqttContext';

export type ClientLayoutProps = {
    children: ReactNode;
};

export const ClientLayout = ({ children }: Readonly<ClientLayoutProps>) => {
    return (
        <EnvProvider>
            <SessionProvider>
                <Internationalization>
                    <CustomThemeProvider>
                        <CurrentAasContextProvider>
                            <NotificationContextProvider>
                                <LayoutRoot>
                                    <MqttProvider>
                                        <Box flexGrow={1} data-testid="notifications">
                                            {children}
                                        </Box>
                                    </MqttProvider>
                                </LayoutRoot>
                            </NotificationContextProvider>
                        </CurrentAasContextProvider>
                    </CustomThemeProvider>
                </Internationalization>
            </SessionProvider>
        </EnvProvider>
    );
};
