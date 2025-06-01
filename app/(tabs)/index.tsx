import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { db, auth } from '../../FirebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { router } from 'expo-router';
import { Event } from '../../types';

const EventsScreen = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAttendances, setUserAttendances] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchEventsAndAttendance = async () => {
      const q = query(collection(db, 'events'), orderBy('date', 'asc'));
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const eventsData: Event[] = [];
        querySnapshot.forEach((doc) => {
          eventsData.push({ id: doc.id, ...doc.data() } as Event);
        });
        setEvents(eventsData);

        if (auth.currentUser) {
          const attendanceData: Record<string, boolean> = {};
          for (const event of eventsData) {
            const attendanceRef = doc(db, 'events', event.id!, 'attendances', auth.currentUser.uid);
            const attendanceSnap = await getDoc(attendanceRef);
            attendanceData[event.id!] = attendanceSnap.exists() && attendanceSnap.data()?.attending;
          }
          setUserAttendances(attendanceData);
        }

        setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchEventsAndAttendance();
  }, []);

  const toggleAttendance = async (eventId: string) => {
    if (!auth.currentUser) {
      alert('Debes iniciar sesión para confirmar asistencia');
      return;
    }

    try {
      const attendanceRef = doc(db, 'events', eventId, 'attendances', auth.currentUser.uid);
      const isAttending = userAttendances[eventId];

      if (isAttending) {
        await setDoc(attendanceRef, {
          attending: false,
          attended: false,
          userId: auth.currentUser.uid,
          timestamp: new Date()
        }, { merge: true });
      } else {
        await setDoc(attendanceRef, {
          attending: true,
          attended: false,
          userId: auth.currentUser.uid,
          timestamp: new Date()
        });
      }

      setUserAttendances(prev => ({
        ...prev,
        [eventId]: !isAttending
      }));
    } catch (error) {
      console.error('Error al confirmar asistencia:', error);
      alert('Error al confirmar asistencia');
    }
  };

  const handleEventPress = (event: Event) => {
    router.push({
      pathname: '/EventDetailsScreen',
      params: {
        eventId: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        description: event.description || '',
        isAttending: userAttendances[event.id!] ? 'true' : 'false'
      }
    });
  };

  if (loading) {
    return (
        <SafeAreaView style={styles.container}>
          <Text>Cargando eventos...</Text>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.container}>
        <FlatList
            data={events}
            keyExtractor={(item) => item.id!}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.eventCard}
                    onPress={() => handleEventPress(item)}
                >
                  <Text style={styles.eventTitle}>{item.title}</Text>

                  <View style={styles.detailsContainer}>
                    <Text style={styles.eventDetail}>Fecha: {item.date}</Text>
                    <Text style={styles.eventDetail}>Ubicación: {item.location}</Text>
                  </View>

                  {item.description && (
                      <Text style={styles.eventDescription}>{item.description}</Text>
                  )}

                  <TouchableOpacity
                      style={[
                        styles.attendanceButton,
                        userAttendances[item.id!] && styles.attendingButton
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleAttendance(item.id!);
                      }}
                  >
                    <Text style={styles.attendanceButtonText}>
                      {userAttendances[item.id!] ? 'Asistiré ✓' : 'Asistiré'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay eventos próximos</Text>
            }
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/CreateEventScreen')}
        >
          <Text style={styles.createButtonText}>Crear Nuevo Evento</Text>
        </TouchableOpacity>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 80,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  eventDetail: {
    fontSize: 16,
    color: '#555',
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 15,
    lineHeight: 22,
  },
  attendanceButton: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  attendingButton: {
    backgroundColor: '#c8e6c9',
    borderColor: '#a5d6a7',
  },
  attendanceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
  separator: {
    height: 15,
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4285f4',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventsScreen;