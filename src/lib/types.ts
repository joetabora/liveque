import { Timestamp } from "firebase/firestore";

export type QueueStatus = "waiting" | "serving" | "done";

export interface QueueItem {
  id: string;
  name: string;
  serviceType?: string;
  status: QueueStatus;
  position: number;
  createdAt: Timestamp;
}

export interface QueueItemInput {
  name: string;
  serviceType?: string;
}

export const SERVICE_TYPES = [
  "Sales",
  "Oil Change",
  "Tire Service",
  "Engine Tune-Up",
  "Brake Service",
  "Custom Install",
  "Detailing",
  "General Service",
  "Inspection",
] as const;
