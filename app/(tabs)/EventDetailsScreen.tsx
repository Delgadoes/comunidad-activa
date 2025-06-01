import { useSearchParams } from "expo-router";
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, TextInput, ScrollView } from 'react-native';
import { db } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth } from '../../FirebaseConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { Event } from '../../types';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

type Comment = {
    id: string;
    userId: string;
    userName: string;
    text: string;
    rating: number;
    createdAt: Date;
};

const EventDetailsScreen = () => {
    const { id } = useLocalSearchParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAttending, setIsAttending] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [rating, setRating] = useState(5);
    const [attendeesCount, setAttendeesCount] = useState(0);

    const eventId = Array.isArray(id) ? id[0] : id;

    // Cargar evento y verificar asistencia
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                if (!eventId) return;
                
                const docRef = doc(db, 'events', eventId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const eventData = { id: docSnap.id, ...docSnap.data() } as Event;
                    setEvent(eventData);
                    
                    // Actualizar contador de asistentes
                    setAttendeesCount(eventData.attendees?.length || 0);

                    // Verificar asistencia del usuario actual
                    const user = auth.currentUser;
                    if (user && eventData.attendees?.includes(user.uid)) {
                        setIsAttending(true);
                    } else {
                        setIsAttending(false);
                    }
                }
            } catch (error) {
                console.error('Error fetching event:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    // Cargar comentarios
    useEffect(() => {
        if (!eventId) return;
        const q = query(collection(db, 'events', eventId, 'comments'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const commentsData: Comment[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                commentsData.push({ 
                    id: doc.id, 
                    userId: data.userId,
                    userName: data.userName,
                    text: data.text,
                    rating: data.rating,
                    createdAt: data.createdAt.toDate()
                });
            });
            setComments(commentsData);
        });
        return () => unsubscribe();
    }, [eventId]);

    // Manejar confirmación/cancelación de asistencia
    const handleRSVP = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert('Debes iniciar sesión para confirmar asistencia');
            router.push('/login');
            return;
        }

        if (!eventId) return;

        try {
            const eventRef = doc(db, 'events', eventId);

            if (isAttending) {
                // Cancelar asistencia
                await updateDoc(eventRef, {
                    attendees: arrayRemove(user.uid)
                });
                setIsAttending(false);
                setAttendeesCount(prev => prev - 1);
                alert('Has cancelado tu asistencia al evento');
            } else {
                // Confirmar asistencia
                await updateDoc(eventRef, {
                    attendees: arrayUnion(user.uid)
                });
                setIsAttending(true);
                setAttendeesCount(prev => prev + 1);
                alert('¡Asistencia confirmada! Te esperamos en el evento');
            }
        } catch (error) {
            console.error('Error updating attendance:', error);
            alert('Error al actualizar tu asistencia');
        }
    };

    // Agregar comentario (solo para asistentes)
    const handleAddComment = async () => {
        const user = auth.currentUser;
        if (!user || !commentText.trim() || !eventId) return;
        
        if (!isAttending) {
            alert('Solo los asistentes pueden dejar comentarios');
            return;
        }

        try {
            await addDoc(collection(db, 'events', eventId, 'comments'), {
                userId: user.uid,
                userName: user.email || 'Anónimo',
                text: commentText,
                rating,
                createdAt: new Date()
            });
            setCommentText('');
            setRating(5);
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Error al agregar el comentario');
        }
    };

    // Compartir evento según indicaciones
const handleShare = async () => {
    if (!event) return;
    
    const shareText = `¡Mira este evento en nuestra app!\n\n` +
                     `*${event.title}*\n\n` +
                     `${event.description}\n\n` +
                     `📅 Fecha: ${event.date}\n` +
                     `⏰ Hora: ${event.time}\n` +
                     `📍 Ubicación: ${event.location}\n\n` +
                     `Actualmente hay ${attendeesCount} personas confirmadas.`;

    try {
        // Usamos el API de Share de React Native que funciona mejor para compartir en redes sociales
        await Share.share({
            message: shareText,
            title: 'Compartir evento',
        });
    } catch (error) {
        console.error('Error sharing event:', error);
        alert('Error al compartir el evento');
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
        <ScrollView style={styles.container}>
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
                Asistentes confirmados: {attendeesCount}
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

            <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShare}
            >
                <Text style={styles.shareButtonText}>📤 Compartir evento</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Comentarios y Calificaciones</Text>
            
            <View style={styles.commentsContainer}>
                {comments.length === 0 ? (
                    <Text style={styles.noCommentsText}>No hay comentarios aún.</Text>
                ) : (
                    comments.map((item) => (
                        <View key={item.id} style={styles.commentItem}>
                            <Text style={styles.commentUser}>
                                {item.userName} - {item.rating}⭐
                            </Text>
                            <Text style={styles.commentText}>{item.text}</Text>
                        </View>
                    ))
                )}
            </View>
            
            {isAttending && (
                <View style={styles.commentForm}>
                    <Text style={styles.commentFormTitle}>Deja tu comentario:</Text>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Escribe tu experiencia en el evento..."
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        numberOfLines={4}
                    />
                    <View style={styles.ratingContainer}>
                        <Text style={styles.ratingLabel}>Calificación: </Text>
                        {[1, 2, 3, 4, 5].map(num => (
                            <TouchableOpacity 
                                key={num} 
                                onPress={() => setRating(num)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.star,
                                    { color: rating >= num ? '#FFD700' : '#ccc' }
                                ]}>★</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity 
                        style={styles.submitCommentButton}
                        onPress={handleAddComment}
                        disabled={!commentText.trim()}
                    >
                        <Text style={styles.submitCommentButtonText}>
                            Enviar comentario
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
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
        color: '#333',
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    detailLabel: {
        fontWeight: 'bold',
        width: 100,
        color: '#555',
    },
    detailValue: {
        flex: 1,
        color: '#333',
    },
    descriptionContainer: {
        marginVertical: 20,
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
    },
    organizerContainer: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    organizerText: {
        fontStyle: 'italic',
        color: '#666',
    },
    attendeesText: {
        marginTop: 15,
        color: '#4285F4',
        fontWeight: 'bold',
        fontSize: 16,
    },
    rsvpButton: {
        marginTop: 25,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        elevation: 3,
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
    shareButton: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    shareButtonText: {
        color: '#4285F4',
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginTop: 25,
        marginBottom: 15,
        fontSize: 18,
        color: '#333',
    },
    commentsContainer: {
        marginBottom: 20,
        maxHeight: 300,
    },
    noCommentsText: {
        color: '#888',
        textAlign: 'center',
        marginVertical: 15,
    },
    commentItem: {
        marginVertical: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4285F4',
    },
    commentUser: {
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    commentText: {
        color: '#555',
    },
    commentForm: {
        marginTop: 15,
        marginBottom: 30,
    },
    commentFormTitle: {
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        minHeight: 100,
        textAlignVertical: 'top',
        backgroundColor: '#f9f9f9',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    ratingLabel: {
        marginRight: 10,
        color: '#555',
    },
    star: {
        fontSize: 28,
        marginHorizontal: 3,
    },
    submitCommentButton: {
        backgroundColor: '#4285F4',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
    },
    submitCommentButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default EventDetailsScreen;