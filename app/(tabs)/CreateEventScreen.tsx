import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, ScrollView } from 'react-native';
import { db } from '../../FirebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { router } from 'expo-router';
import { auth } from '../../FirebaseConfig';

const CreateEventScreen = () => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    const handleCreateEvent = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                alert('Debes iniciar sesión para crear un evento');
                return;
            }

            await addDoc(collection(db, 'events'), {
                title,
                description,
                date,
                location,
                organizerId: user.uid,
                organizerName: user.email,
                attendees: [],
                createdAt: serverTimestamp()
            });

            alert('Evento creado con éxito');
            // Reiniciar los valores del formulario
            setTitle('');
            setDate('');
            setLocation('');
            setDescription('');
            // Eliminar router.back() para permanecer en la misma pantalla
        } catch (error) {
            console.error('Error al crear el evento:', error);
            alert('Error al crear el evento');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.header}>Comunidad</Text>

                <Text style={styles.sectionTitle}>Crear nuevo evento</Text>

                {/* Título del Evento */}
                <Text style={styles.fieldLabel}>Título del evento:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingresa el título del evento"
                    value={title}
                    onChangeText={setTitle}
                />

                {/* Fecha */}
                <Text style={styles.fieldLabel}>Fecha:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="dd/mm/yyyy"
                    value={date}
                    onChangeText={setDate}
                />

                {/* Ubicación */}
                <Text style={styles.fieldLabel}>Ubicación:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingresa la ubicación"
                    value={location}
                    onChangeText={setLocation}
                />

                {/* Descripción */}
                <Text style={styles.fieldLabel}>Descripción:</Text>
                <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    placeholder="Describe el evento..."
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                />

                {/* Separador */}
                <View style={styles.separator} />

                {/* Botón Crear Evento */}
                <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
                    <Text style={styles.createButtonText}>Crear evento</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContainer: {
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 30,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333333',
    },
    descriptionInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    separator: {
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginVertical: 20,
    },
    createButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CreateEventScreen;