export interface Event {
  id: string;
  name: string;
  venue: string;
  date: string;
  lat: number;
  lng: number;
  url?: string;
  imageUrl?: string;
  category?: string;
}
