import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TextInput, Alert, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth, db } from '../../FirebaseConfig';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Rating } from 'react-native-ratings';
import * as Linking from 'expo-linking';

interface Comment {
    id: string;
    userId: string;
    userName: string;
    text: string;
    rating: number;
    createdAt: Date;
}

const EventDetailsScreen = () => {
    const { eventId, title, date, location, description, isAttending } = useLocalSearchParams();
    const [attending, setAttending] = useState(isAttending === 'true');
    const [attended, setAttended] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(3);
    const [loadingComments, setLoadingComments] = useState(true);

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

    useEffect(() => {
        if (!eventId) return;

        const commentsRef = collection(db, 'events', eventId as string, 'comments');
        const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
            const commentsData: Comment[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                commentsData.push({
                    id: doc.id,
                    userId: data.userId,
                    userName: data.userName || 'Anónimo',
                    text: data.text,
                    rating: data.rating || 0,
                    createdAt: data.createdAt?.toDate() || new Date(),
                });
            });
            setComments(commentsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
            setLoadingComments(false);
        });

        return () => unsubscribe();
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

    const handleAddComment = async () => {
        if (!auth.currentUser || !eventId) {
            alert('Debes iniciar sesión para comentar');
            return;
        }

        if (!newComment.trim()) {
            alert('Por favor escribe un comentario');
            return;
        }

        try {
            const commentsRef = collection(db, 'events', eventId as string, 'comments');
            await addDoc(commentsRef, {
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || 'Anónimo',
                text: newComment,
                rating: rating,
                createdAt: new Date()
            });
            setNewComment('');
            Alert.alert('Éxito', 'Tu comentario ha sido publicado');
        } catch (error) {
            console.error('Error al agregar comentario:', error);
            Alert.alert('Error', 'No se pudo publicar el comentario');
        }
    };

    const handleShareEvent = async () => {
        try {
            const shareUrl = Linking.createURL(`/EventDetailsScreen?eventId=${eventId}`);

            await Share.share({
                title: `Evento: ${title}`,
                message: `¡Mira este evento!\n\n${title}\nFecha: ${date}\nUbicación: ${location}\n\nMás detalles: ${shareUrl}`,
                url: shareUrl
            });
        } catch (error) {
            console.error('Error al compartir:', error);
        }
    };

    const averageRating = comments.length > 0
        ? (comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length).toFixed(1)
        : '0.0';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>{title}</Text>

                    <View style={styles.detailsContainer}>
                        <Text style={styles.detail}>Fecha: {date}</Text>
                        <Text style={styles.detail}>Ubicación: {location}</Text>
                    </View>

                    {description && (
                        <Text style={styles.description}>{description}</Text>
                    )}

                    {/* Rating promedio */}
                    <View style={styles.ratingContainer}>
                        <Text style={styles.sectionTitle}>Calificación promedio: {averageRating}</Text>
                        <Rating
                            type='star'
                            ratingCount={5}
                            imageSize={25}
                            readonly
                            startingValue={parseFloat(averageRating)}
                            style={styles.ratingStars}
                        />
                    </View>

                    {/* Botones de acción */}
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
                            style={[styles.button, styles.shareButton]}
                            onPress={handleShareEvent}
                        >
                            <Text style={styles.buttonText}>Compartir evento</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.backButton]}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.buttonText}>Volver</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sección de comentarios */}
                    <Text style={styles.sectionTitle}>Comentarios ({comments.length})</Text>

                    {attended && (
                        <View style={styles.commentInputContainer}>
                            <Text style={styles.commentTitle}>Deja tu comentario</Text>
                            <Rating
                                type='star'
                                ratingCount={5}
                                imageSize={30}
                                startingValue={rating}
                                onFinishRating={setRating}
                                style={styles.ratingInput}
                            />
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Escribe tu comentario..."
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                                numberOfLines={4}
                            />
                            <TouchableOpacity
                                style={styles.submitCommentButton}
                                onPress={handleAddComment}
                            >
                                <Text style={styles.submitCommentButtonText}>Publicar comentario</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {loadingComments ? (
                        <Text>Cargando comentarios...</Text>
                    ) : comments.length === 0 ? (
                        <Text style={styles.noCommentsText}>No hay comentarios aún</Text>
                    ) : (
                        <View style={styles.commentsList}>
                            {comments.map((comment) => (
                                <View key={comment.id} style={styles.commentCard}>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.commentAuthor}>{comment.userName}</Text>
                                        <Rating
                                            type='star'
                                            ratingCount={5}
                                            imageSize={15}
                                            readonly
                                            startingValue={comment.rating}
                                        />
                                    </View>
                                    <Text style={styles.commentText}>{comment.text}</Text>
                                    <Text style={styles.commentDate}>
                                        {comment.createdAt.toLocaleDateString()}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        paddingBottom: 20,
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 20,
        marginBottom: 10,
    },
    ratingContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    ratingStars: {
        marginTop: 5,
    },
    ratingInput: {
        marginVertical: 10,
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
    shareButton: {
        backgroundColor: '#ff9800',
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
    commentInputContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    commentTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#2c3e50',
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
        marginBottom: 15,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    submitCommentButton: {
        backgroundColor: '#4285f4',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitCommentButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    commentsList: {
        marginTop: 10,
    },
    commentCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    commentAuthor: {
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    commentText: {
        fontSize: 15,
        color: '#333',
        marginBottom: 10,
    },
    commentDate: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
    },
    noCommentsText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 20,
    },
});

export default EventDetailsScreen;