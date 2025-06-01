import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { db } from '../../FirebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { router } from 'expo-router';
import { Event } from '../../types';

const EventsScreen = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData: Event[] = [];
      querySnapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() } as Event);
      });
      setEvents(eventsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEventPress = (eventId: string) => {
    router.push(`/(tabs)/EventDetailsScreen?id=${eventId}`);
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
        <Text style={styles.title}>Próximos Eventos</Text>

        <FlatList
            data={events}
            keyExtractor={(item) => item.id!}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.eventCard}
                    onPress={() => handleEventPress(item.id!)}
                >
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventDate}>{item.date} a las {item.time}</Text>
                  <Text style={styles.eventLocation}>{item.location}</Text>
                </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay eventos próximos</Text>
            }
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
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  eventCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventDate: {
    color: '#666',
    marginBottom: 3,
  },
  eventLocation: {
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  createButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EventsScreen;