import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useState, useCallback } from 'react';
import { auth, db } from '../../FirebaseConfig';
import { collection, query, where, getDocs, getCountFromServer,doc,getDoc } from 'firebase/firestore';

const CommunityScreen = () => {
    const [stats, setStats] = useState({
        totalEvents: 0,
        eventsAttended: 0,
        eventsWillAttend: 0,
        eventsNotAttended: 0,
        participationRate: 0,
        eventsByMonth: [],
        popularEvents: []
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
            }

            const eventsNotAttended = totalEvents - eventsAttended - eventsWillAttend;
            const participationRate = totalEvents > 0 ? Math.round((eventsAttended / totalEvents) * 100) : 0;

            // Obtener eventos más populares (contando asistentes reales)
            const popularEvents = [];
            for (const eventDoc of eventsSnapshot.docs) {
                const attendancesRef = collection(db, 'events', eventDoc.id, 'attendances');
                const attendedQuery = query(attendancesRef, where('attended', '==', true));
                const attendedSnapshot = await getCountFromServer(attendedQuery);
                const attendeesCount = attendedSnapshot.data().count;

                popularEvents.push({
                    id: eventDoc.id,
                    title: eventDoc.data().title,
                    attendees: attendeesCount
                });
            }

            // Ordenar por popularidad y tomar los top 3
            popularEvents.sort((a, b) => b.attendees - a.attendees).slice(0, 3);

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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.header}>Estadísticas de la Comunidad</Text>

                {/* Tarjetas de estadísticas */}
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
                        <Text style={styles.statNumber}>{stats.eventsWillAttend}</Text>
                        <Text style={styles.statLabel}>Por asistir</Text>
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

                {/* Gráfico circular de estados de participación */}
                <Text style={styles.sectionTitle}>Estados de participación</Text>
                <View style={styles.chartContainer}>
                    <View style={styles.pieChartContainer}>
                        <View style={styles.pieChart}>
                            {/* Segmento de asistidos */}
                            <View style={[
                                styles.pieChartSegment,
                                styles.pieChartSegmentAttended,
                                {
                                    transform: [
                                        { rotate: '0deg' },
                                        { scaleX: 1.5 }
                                    ]
                                }
                            ]} />
                            {/* Segmento de por asistir */}
                            <View style={[
                                styles.pieChartSegment,
                                styles.pieChartSegmentWillAttend,
                                {
                                    transform: [
                                        { rotate: `${(stats.eventsAttended / stats.totalEvents) * 360}deg` },
                                        { scaleX: 1.5 }
                                    ]
                                }
                            ]} />
                            {/* Centro del gráfico */}
                            <View style={styles.pieChartCenter}>
                                <Text style={styles.pieChartCenterText}>
                                    {stats.participationRate}%
                                </Text>
                                <Text style={styles.pieChartCenterSubtext}>Asistencia</Text>
                            </View>
                        </View>
                        <View style={styles.pieChartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, styles.legendAttended]} />
                                <Text style={styles.legendText}>Asistidos: {stats.eventsAttended}</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, styles.legendWillAttend]} />
                                <Text style={styles.legendText}>Por asistir: {stats.eventsWillAttend}</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, styles.legendNotAttended]} />
                                <Text style={styles.legendText}>No asistidos: {stats.eventsNotAttended}</Text>
                            </View>
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
                                <Text style={styles.popularEventAttendees}>{event.attendees} asistentes</Text>
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
        marginBottom: 20,
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
    // Estilos para el gráfico de barras
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
    // Estilos para el gráfico circular
    pieChartContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    pieChart: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#F44336',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    pieChartSegment: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transformOrigin: 'center',
    },
    pieChartSegmentAttended: {
        backgroundColor: '#4CAF50',
    },
    pieChartSegmentWillAttend: {
        backgroundColor: '#2196F3',
    },
    pieChartCenter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pieChartCenterText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    pieChartCenterSubtext: {
        fontSize: 12,
        color: '#666',
    },
    pieChartLegend: {
        marginLeft: 20,
    },
    // Estilos comunes para leyendas
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
    // Estilos para eventos populares
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
    popularEventAttendees: {
        fontSize: 14,
        color: '#666',
    },
});

export default CommunityScreen;