export interface CirculationData {
  address: string;
  withdrawBlockNumber?: number;
  circulationBlockNumber?: number;
  withdrawConfirmed?: boolean;
  circulationConfirmed?: boolean;
  createdAt?: FirebaseFirestore.Timestamp;
}

export interface CirculationFilters {
  addresses?: string[];
}
