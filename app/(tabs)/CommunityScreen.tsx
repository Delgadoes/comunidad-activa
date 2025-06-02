import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useState, useCallback } from 'react';
import { auth, db } from '../../FirebaseConfig';
import { collection, query, where, getDocs, getCountFromServer, doc, getDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

interface PopularEvent {
    id: string;
    title: string;
    attendees: number;
    commentsCount: number;
    averageRating: number;
}

const CommunityScreen = () => {
    const [stats, setStats] = useState({
        totalEvents: 0,
        eventsAttended: 0,
        eventsWillAttend: 0,
        eventsNotAttended: 0,
        participationRate: 0,
        totalComments: 0,
        averageEventRating: 0,
        eventsByMonth: [],
        popularEvents: [] as PopularEvent[]
    });
    const [loading, setLoading] = useState(true);

    const fetchCommunityStats = useCallback(async () => {
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Obtener todos los eventos
            const eventsRef = collection(db, 'events');
            const eventsSnapshot = await getDocs(eventsRef);
            const totalEvents = eventsSnapshot.size;

            // Contadores para los diferentes estados
            let eventsAttended = 0;
            let eventsWillAttend = 0;
            let totalComments = 0;
            let totalRatings = 0;
            let ratedEvents = 0;

            // Verificar el estado de asistencia para cada evento
            for (const eventDoc of eventsSnapshot.docs) {
                const attendanceRef = doc(db, 'events', eventDoc.id, 'attendances', auth.currentUser.uid);
                const attendanceSnap = await getDoc(attendanceRef);

                if (attendanceSnap.exists()) {
                    const data = attendanceSnap.data();
                    if (data.attended) {
                        eventsAttended++;
                    } else if (data.attending) {
                        eventsWillAttend++;
                    }
                }

                // Obtener estadísticas de comentarios y ratings
                const commentsRef = collection(db, 'events', eventDoc.id, 'comments');
                const commentsQuery = query(commentsRef);
                const commentsSnapshot = await getDocs(commentsQuery);
                const commentsCount = commentsSnapshot.size;
                totalComments += commentsCount;

                // Calcular promedio de ratings por evento
                if (commentsCount > 0) {
                    const eventRatings = commentsSnapshot.docs.reduce((sum, doc) => {
                        return sum + (doc.data().rating || 0);
                    }, 0);
                    totalRatings += eventRatings;
                    ratedEvents++;
                }
            }

            const eventsNotAttended = totalEvents - eventsAttended - eventsWillAttend;
            const participationRate = totalEvents > 0 ? Math.round((eventsAttended / totalEvents) * 100) : 0;
            const averageEventRating = ratedEvents > 0 ? parseFloat((totalRatings / ratedEvents).toFixed(1)) : 0;

            // Obtener eventos más populares (contando asistentes y comentarios)
            const popularEventsPromises = eventsSnapshot.docs.map(async (eventDoc) => {
                const attendancesRef = collection(db, 'events', eventDoc.id, 'attendances');
                const attendedQuery = query(attendancesRef, where('attended', '==', true));
                const attendedSnapshot = await getCountFromServer(attendedQuery);
                const attendeesCount = attendedSnapshot.data().count;

                const commentsRef = collection(db, 'events', eventDoc.id, 'comments');
                const commentsQuery = query(commentsRef);
                const commentsSnapshot = await getCountFromServer(commentsQuery);
                const commentsCount = commentsSnapshot.data().count;

                // Calcular rating promedio para este evento
                const commentsData = await getDocs(commentsRef);
                let eventRating = 0;
                if (commentsData.size > 0) {
                    const totalRating = commentsData.docs.reduce((sum, doc) => sum + (doc.data().rating || 0), 0);
                    eventRating = parseFloat((totalRating / commentsData.size).toFixed(1));
                }

                return {
                    id: eventDoc.id,
                    title: eventDoc.data().title,
                    attendees: attendeesCount,
                    commentsCount: commentsCount,
                    averageRating: eventRating
                };
            });

            const popularEvents = await Promise.all(popularEventsPromises);
            popularEvents.sort((a, b) => (b.attendees + b.commentsCount) - (a.attendees + a.commentsCount)).slice(0, 3);

            // Datos de asistencia por mes (ejemplo - deberías adaptar según tus datos reales)
            const eventsByMonth = [
                { month: 'Ene', attended: Math.floor(Math.random() * 5), willAttend: Math.floor(Math.random() * 3) },
                { month: 'Feb', attended: Math.floor(Math.random() * 5), willAttend: Math.floor(Math.random() * 3) },
                { month: 'Mar', attended: Math.floor(Math.random() * 5), willAttend: Math.floor(Math.random() * 3) },
                { month: 'Abr', attended: Math.floor(Math.random() * 5), willAttend: Math.floor(Math.random() * 3) },
                { month: 'May', attended: Math.floor(Math.random() * 5), willAttend: Math.floor(Math.random() * 3) },
                { month: 'Jun', attended: Math.floor(Math.random() * 5), willAttend: Math.floor(Math.random() * 3) },
            ];

            setStats({
                totalEvents,
                eventsAttended,
                eventsWillAttend,
                eventsNotAttended,
                participationRate,
                totalComments,
                averageEventRating,
                eventsByMonth,
                popularEvents
            });
        } catch (error) {
            console.error('Error fetching community stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchCommunityStats();
        }, [fetchCommunityStats])
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Cargando estadísticas...</Text>
            </SafeAreaView>
        );
    }

    // Calcular máximos para escalar gráficos
    const maxMonthCount = Math.max(
        ...stats.eventsByMonth.map(m => m.attended + m.willAttend),
        1
    );

    const StarRatingDisplay = ({ rating }: { rating: number }) => {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <Text style={{ marginLeft: 4 }}>{rating}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.header}>Estadísticas de la Comunidad</Text>

                {/* Tarjetas de estadísticas principales */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.totalEvents}</Text>
                        <Text style={styles.statLabel}>Eventos totales</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.eventsAttended}</Text>
                        <Text style={styles.statLabel}>Asistidos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.totalComments}</Text>
                        <Text style={styles.statLabel}>Comentarios</Text>
                    </View>
                </View>

                {/* Estadísticas secundarias */}
                <View style={styles.secondaryStatsRow}>
                    <View style={styles.secondaryStatCard}>
                        <Text style={styles.secondaryStatNumber}>{stats.eventsWillAttend}</Text>
                        <Text style={styles.secondaryStatLabel}>Por asistir</Text>
                    </View>
                    <View style={styles.secondaryStatCard}>
                        <Text style={styles.secondaryStatNumber}>{stats.participationRate}%</Text>
                        <Text style={styles.secondaryStatLabel}>Participación</Text>
                    </View>
                    <View style={styles.secondaryStatCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialIcons name="star" size={20} color="#FFD700" />
                            <Text style={[styles.secondaryStatNumber, { marginLeft: 5 }]}>{stats.averageEventRating}</Text>
                        </View>
                        <Text style={styles.secondaryStatLabel}>Rating promedio</Text>
                    </View>
                </View>

                {/* Gráfico de participación por mes */}
                <Text style={styles.sectionTitle}>Tu participación por mes</Text>
                <View style={styles.chartContainer}>
                    <View style={styles.barChart}>
                        {stats.eventsByMonth.map((month, index) => (
                            <View key={index} style={styles.barChartItem}>
                                <Text style={styles.barChartLabel}>{month.month}</Text>
                                <View style={styles.barChartBars}>
                                    <View style={[
                                        styles.barChartBar,
                                        styles.barChartBarAttended,
                                        { height: `${(month.attended / maxMonthCount) * 100}%` }
                                    ]} />
                                    <View style={[
                                        styles.barChartBar,
                                        styles.barChartBarWillAttend,
                                        { height: `${(month.willAttend / maxMonthCount) * 100}%` }
                                    ]} />
                                </View>
                            </View>
                        ))}
                    </View>
                    <View style={styles.barChartLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, styles.legendAttended]} />
                            <Text style={styles.legendText}>Asistidos</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, styles.legendWillAttend]} />
                            <Text style={styles.legendText}>Por asistir</Text>
                        </View>
                    </View>
                </View>

                {/* Eventos más populares */}
                <Text style={styles.sectionTitle}>Eventos más populares</Text>
                <View style={styles.popularEventsContainer}>
                    {stats.popularEvents.map((event, index) => (
                        <View key={event.id} style={styles.popularEventCard}>
                            <Text style={styles.popularEventRank}>{index + 1}</Text>
                            <View style={styles.popularEventInfo}>
                                <Text style={styles.popularEventTitle}>{event.title}</Text>
                                <View style={styles.popularEventStats}>
                                    <View style={styles.statBadge}>
                                        <MaterialIcons name="people" size={14} color="#666" />
                                        <Text style={styles.statBadgeText}>{event.attendees}</Text>
                                    </View>
                                    <View style={styles.statBadge}>
                                        <MaterialIcons name="comment" size={14} color="#666" />
                                        <Text style={styles.statBadgeText}>{event.commentsCount}</Text>
                                    </View>
                                    {event.averageRating > 0 && (
                                        <View style={styles.statBadge}>
                                            <MaterialIcons name="star" size={14} color="#FFD700" />
                                            <Text style={styles.statBadgeText}>{event.averageRating}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}
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
    scrollContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    statCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 15,
        width: '30%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4285F4',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    secondaryStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    secondaryStatCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        width: '30%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    secondaryStatNumber: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 3,
    },
    secondaryStatLabel: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginTop: 20,
        marginBottom: 10,
    },
    chartContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    barChart: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 200,
        marginBottom: 15,
    },
    barChartItem: {
        alignItems: 'center',
        width: 30,
    },
    barChartLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    barChartBars: {
        height: '80%',
        width: 20,
        justifyContent: 'flex-end',
    },
    barChartBar: {
        width: '100%',
        borderRadius: 3,
    },
    barChartBarAttended: {
        backgroundColor: '#4CAF50',
    },
    barChartBarWillAttend: {
        backgroundColor: '#2196F3',
        marginTop: 2,
    },
    barChartLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
        marginBottom: 5,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 5,
    },
    legendAttended: {
        backgroundColor: '#4CAF50',
    },
    legendWillAttend: {
        backgroundColor: '#2196F3',
    },
    legendNotAttended: {
        backgroundColor: '#F44336',
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
    popularEventsContainer: {
        marginBottom: 20,
    },
    popularEventCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    popularEventRank: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4285F4',
        marginRight: 15,
        width: 30,
        textAlign: 'center',
    },
    popularEventInfo: {
        flex: 1,
    },
    popularEventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 5,
    },
    popularEventStats: {
        flexDirection: 'row',
        marginTop: 5,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
    },
    statBadgeText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
});

export default CommunityScreen;