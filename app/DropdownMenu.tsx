import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../FirebaseConfig';
import { signOut } from 'firebase/auth';

const DropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      console.log('Sesión cerrada exitosamente');
      // Fuerza un reinicio completo de la navegación
      router.replace({
        pathname: '/login',
        params: { refresh: Date.now() },
      });
      // Opcional: recarga la pantalla
      if (router.canGoBack()) {
        router.back();
      }
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión: ' + error.message);
    }
  };

  return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="white" />
        </TouchableOpacity>

        {isOpen && (
            <View style={styles.dropdown}>
              <Link href="/community" asChild>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuText}>Comunidad</Text>
                </TouchableOpacity>
              </Link>
              <View style={styles.divider} />

              <Link href="/EventsScreen" asChild>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuText}>Eventos Disponibles</Text>
                </TouchableOpacity>
              </Link>
              <View style={styles.divider} />

              <Link href="/CreateEventScreen" asChild>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuText}>Crear evento</Text>
                </TouchableOpacity>
              </Link>
              <View style={styles.divider} />

              <Link href="/AttendanceHistoryScreen" asChild>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuText}>Historial</Text>
                </TouchableOpacity>
              </Link>
              <View style={styles.divider} />

              <TouchableOpacity
                  style={styles.menuItem}
                  onPress={cerrarSesion}
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
    marginRight: 10,
  },
  menuButton: {
    padding: 10,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingVertical: 5,
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
    color: 'white',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10,
  },
});

export default DropdownMenu;