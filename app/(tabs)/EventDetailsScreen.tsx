import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { db } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth } from '../../FirebaseConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { Event } from '../../types';

const EventDetailsScreen = () => {
    const { id } = useLocalSearchParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAttending, setIsAttending] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const docRef = doc(db, 'events', id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const eventData = { id: docSnap.id, ...docSnap.data() } as Event;
                    setEvent(eventData);

                    // Verificar si el usuario actual está en la lista de asistentes
                    const user = auth.currentUser;
                    if (user && eventData.attendees.includes(user.uid)) {
                        setIsAttending(true);
                    }
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching event:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    const handleRSVP = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert('Debes iniciar sesión para confirmar asistencia');
            return;
        }

        if (!event) return;

        try {
            const eventRef = doc(db, 'events', event.id!);

            if (isAttending) {
                await updateDoc(eventRef, {
                    attendees: arrayRemove(user.uid)
                });
                setIsAttending(false);
                alert('Has cancelado tu asistencia al evento');
            } else {
                await updateDoc(eventRef, {
                    attendees: arrayUnion(user.uid)
                });
                setIsAttending(true);
                alert('¡Asistencia confirmada! Te esperamos en el evento');
            }
        } catch (error) {
            console.error('Error updating attendance:', error);
            alert('Error al actualizar tu asistencia');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Cargando detalles del evento...</Text>
            </SafeAreaView>
        );
    }

    if (!event) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Evento no encontrado</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>{event.title}</Text>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha:</Text>
                <Text style={styles.detailValue}>{event.date}</Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hora:</Text>
                <Text style={styles.detailValue}>{event.time}</Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ubicación:</Text>
                <Text style={styles.detailValue}>{event.location}</Text>
            </View>

            <View style={styles.descriptionContainer}>
                <Text style={styles.description}>{event.description}</Text>
            </View>

            <View style={styles.organizerContainer}>
                <Text style={styles.organizerText}>Organizado por: {event.organizerName}</Text>
            </View>

            <Text style={styles.attendeesText}>
                Asistentes confirmados: {event.attendees.length}
            </Text>

            <TouchableOpacity
                style={[
                    styles.rsvpButton,
                    isAttending ? styles.cancelButton : styles.confirmButton
                ]}
                onPress={handleRSVP}
            >
                <Text style={styles.rsvpButtonText}>
                    {isAttending ? 'Cancelar Asistencia' : 'Confirmar Asistencia'}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    detailLabel: {
        fontWeight: 'bold',
        width: 100,
    },
    detailValue: {
        flex: 1,
    },
    descriptionContainer: {
        marginVertical: 20,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    organizerContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    organizerText: {
        fontStyle: 'italic',
        color: '#666',
    },
    attendeesText: {
        marginTop: 10,
        color: '#4285F4',
        fontWeight: 'bold',
    },
    rsvpButton: {
        marginTop: 30,
        padding: 15,
        borderRadius: 6,
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButton: {
        backgroundColor: '#f44336',
    },
    rsvpButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default EventDetailsScreen;