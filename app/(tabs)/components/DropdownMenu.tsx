import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const DropdownMenu = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.menuButton}>
                <Ionicons name="menu" size={28} color="black" />
            </TouchableOpacity>

            {isOpen && (
                <View style={styles.dropdown}>
                    <Link href="/community" asChild>
                        <TouchableOpacity style={styles.menuItem}>
                            <Text style={styles.menuText}>Comunidad</Text>
                        </TouchableOpacity>
                    </Link>

                    <Link href="/events" asChild>
                        <TouchableOpacity style={styles.menuItem}>
                            <Text style={styles.menuText}>Eventos Disponibles</Text>
                        </TouchableOpacity>
                    </Link>

                    <Link href="/create-event" asChild>
                        <TouchableOpacity style={styles.menuItem}>
                            <Text style={styles.menuText}>Crear evento</Text>
                        </TouchableOpacity>
                    </Link>

                    <Link href="/history" asChild>
                        <TouchableOpacity style={styles.menuItem}>
                            <Text style={styles.menuText}>Historial</Text>
                        </TouchableOpacity>
                    </Link>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {/* Lógica para cerrar sesión */}}
                    >
                        <Text style={styles.menuText}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 100,
    },
    menuButton: {
        padding: 10,
    },
    dropdown: {
        position: 'absolute',
        top: 50,
        left: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        width: 200,
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuText: {
        fontSize: 16,
    },
});

export default DropdownMenu;