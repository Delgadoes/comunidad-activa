import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth, db } from '../../FirebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const EventDetailsScreen = () => {
    const { eventId, title, date, location, description, isAttending } = useLocalSearchParams();
    const [attending, setAttending] = useState(isAttending === 'true');
    const [attended, setAttended] = useState(false);

    useEffect(() => {
        const fetchAttendanceStatus = async () => {
            if (auth.currentUser && eventId) {
                const attendanceRef = doc(db, 'events', eventId as string, 'attendances', auth.currentUser.uid);
                const attendanceSnap = await getDoc(attendanceRef);

                if (attendanceSnap.exists()) {
                    const attendanceData = attendanceSnap.data();
                    setAttending(attendanceData.attending || false);
                    setAttended(attendanceData.attended || false);
                }
            }
        };

        fetchAttendanceStatus();
    }, [eventId]);

    const toggleAttendance = async (action: 'willAttend' | 'attended' | 'cancel') => {
        if (!auth.currentUser || !eventId) {
            alert('Debes iniciar sesión para confirmar asistencia');
            return;
        }

        try {
            const attendanceRef = doc(db, 'events', eventId as string, 'attendances', auth.currentUser.uid);

            switch (action) {
                case 'willAttend':
                    await setDoc(attendanceRef, {
                        attending: true,
                        attended: false,
                        userId: auth.currentUser.uid,
                        timestamp: new Date()
                    });
                    setAttending(true);
                    setAttended(false);
                    break;

                case 'attended':
                    await setDoc(attendanceRef, {
                        attending: false,
                        attended: true,
                        userId: auth.currentUser.uid,
                        timestamp: new Date()
                    }, { merge: true });
                    setAttending(false);
                    setAttended(true);
                    alert('¡Gracias por confirmar tu asistencia!');
                    break;

                case 'cancel':
                    await setDoc(attendanceRef, {
                        attending: false,
                        attended: false,
                        userId: auth.currentUser.uid,
                        timestamp: new Date()
                    }, { merge: true });
                    setAttending(false);
                    setAttended(false);
                    break;
            }
        } catch (error) {
            console.error('Error al actualizar asistencia:', error);
            alert('Error al actualizar asistencia');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>

                <View style={styles.detailsContainer}>
                    <Text style={styles.detail}>Fecha: {date}</Text>
                    <Text style={styles.detail}>Ubicación: {location}</Text>
                </View>

                {description && (
                    <Text style={styles.description}>{description}</Text>
                )}

                <View style={styles.buttonsContainer}>
                    {!attending && !attended ? (
                        <TouchableOpacity
                            style={[styles.button, styles.willAttendButton]}
                            onPress={() => toggleAttendance('willAttend')}
                        >
                            <Text style={styles.buttonText}>Asistiré</Text>
                        </TouchableOpacity>
                    ) : attending ? (
                        <>
                            <TouchableOpacity
                                style={[styles.button, styles.attendedButton]}
                                onPress={() => toggleAttendance('attended')}
                            >
                                <Text style={styles.buttonText}>Marcar como asistido</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => toggleAttendance('cancel')}
                            >
                                <Text style={styles.buttonText}>Cancelar asistencia</Text>
                            </TouchableOpacity>
                        </>
                    ) : attended && (
                        <Text style={styles.attendedText}>Ya asististe a este evento</Text>
                    )}

                    <TouchableOpacity
                        style={[styles.button, styles.backButton]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.buttonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
    },
    detailsContainer: {
        marginBottom: 20,
    },
    detail: {
        fontSize: 18,
        color: '#555',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 30,
    },
    buttonsContainer: {
        marginTop: 20,
    },
    button: {
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    willAttendButton: {
        backgroundColor: '#4285f4',
    },
    attendedButton: {
        backgroundColor: '#4caf50',
    },
    cancelButton: {
        backgroundColor: '#f44336',
    },
    backButton: {
        backgroundColor: '#9e9e9e',
    },
    attendedText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#4caf50',
        marginBottom: 15,
        fontWeight: '600',
    },
});

export default EventDetailsScreen;