export type Slot = {
  starts_at: string; // ISO timestamptz
  available: boolean;
};

export type AvailableDay = {
  date: string; // yyyy-MM-dd
  available: boolean;
};
