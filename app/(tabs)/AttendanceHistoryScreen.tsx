import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth, db } from '../../FirebaseConfig';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { Event } from '../../types';

const AttendanceHistoryScreen = () => {
    const [attendedEvents, setAttendedEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendedEvents = async () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }

            try {
                // Obtener todos los eventos
                const eventsQuery = query(collection(db, 'events'));
                const eventsSnapshot = await getDocs(eventsQuery);

                const eventsData: Event[] = [];

                // Verificar asistencia en cada evento
                for (const eventDoc of eventsSnapshot.docs) {
                    const attendanceRef = doc(db, 'events', eventDoc.id, 'attendances', auth.currentUser.uid);
                    const attendanceSnap = await getDoc(attendanceRef);

                    if (attendanceSnap.exists() && attendanceSnap.data()?.attended) {
                        const eventData = eventDoc.data();
                        eventsData.push({
                            id: eventDoc.id,
                            title: eventData.title,
                            description: eventData.description,
                            date: eventData.date,
                            location: eventData.location,
                            organizerId: eventData.organizerId,
                            organizerName: eventData.organizerName
                        } as Event);
                    }
                }

                setAttendedEvents(eventsData);
            } catch (error) {
                console.error('Error fetching attended events:', error);
                alert('Error al cargar el historial de asistencia');
            } finally {
                setLoading(false);
            }
        };

        fetchAttendedEvents();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Cargando historial...</Text>
            </SafeAreaView>
        );
    }

    if (attendedEvents.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.emptyText}>No has asistido a ningún evento aún</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Eventos a los que asististe</Text>

            <FlatList
                data={attendedEvents}
                keyExtractor={(item) => item.id!}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.eventCard}
                        onPress={() => router.push({
                            pathname: '/EventDetailsScreen',
                            params: {
                                eventId: item.id,
                                title: item.title,
                                date: item.date,
                                location: item.location,
                                description: item.description || '',
                                isAttending: 'false',
                                attended: 'true'
                            }
                        })}
                    >
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <Text style={styles.eventDate}>{item.date}</Text>
                        <Text style={styles.eventLocation}>{item.location}</Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    eventCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    eventDate: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    eventLocation: {
        fontSize: 14,
        color: '#555',
    },
    separator: {
        height: 12,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        color: '#666',
    },
});

export default AttendanceHistoryScreen;