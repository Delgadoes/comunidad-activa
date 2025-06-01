import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import DropdownMenu from '../DropdownMenu';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>['name'];
    color: string;
}) {
    return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: 'blue',
                headerShown: true,
                headerRight: () => <DropdownMenu />,
                headerTitle: '🌟 Comunidad', // Elimina el título por defecto
                headerStyle: {
                    backgroundColor: '#4285F4', // Color azul similar al de tu menú desplegable
                },
                // ESTA ES LA PARTE CLAVE PARA ELIMINAR LA BARRA
                tabBarStyle: {
                    display: 'none' // Esto oculta completamente la barra de tabs
                },
                // Opcional: si quieres mantenerla pero invisible
                /*
                tabBarStyle: {
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                    height: 0
                }
                */
            }}>
            {/* Tus pantallas permanecen igual */}
            <Tabs.Screen
                name="index" // Cambié "EventsScreen" a "index" para coincidir con convenciones
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,

                }}
            />
            {/* Resto de tus pantallas... */}
        </Tabs>
    );
}