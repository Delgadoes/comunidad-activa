export interface Event {
    id?: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    organizerId: string;
    organizerName: string;
    attendees: string[];
    createdAt?: Date;
    imageUrl?: string;
}

export interface Comment {
  id?: string;
  userId: string;
  userName: string;
  text: string;
  rating: number;
  createdAt: Date;
}