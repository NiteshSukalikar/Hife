export type Ticket = {
  id: string;
  title: string;
  info: string;
  priority: "P0" | "P1" | "P2" | "P3";
  budget: number;
  status: string;
  image?: string | null;
  createdAt?: any; // Firestore Timestamp
};