// Domain model for Pack&Sun (see docs/PLANO_DESENVOLVIMENTO.md §4).
// Dates are ISO strings so everything serialises as-is: days are 'yyyy-MM-dd',
// times 'HH:mm', timestamps full ISO.

export type ID = string;
export type ISODate = string;
export type ISOTime = string;
export type ISODateTime = string;

export type Conditions = {
  wheelchair: boolean;
  allergies: string[];
  medication: string[];
};

export type User = {
  id: ID;
  email: string;
  name: string;
  conditions: Conditions;
  /** False until the user finishes (or skips) onboarding. */
  onboarded: boolean;
  settings?: UserSettings;
  createdAt: ISODateTime;
};

export type UserSettings = {
  tempUnit: 'C' | 'F';
  /** Remind to pack 2 days before a trip (stored only; no push in the prototype). */
  packingReminder: boolean;
};

export const DEFAULT_SETTINGS: UserSettings = { tempUnit: 'C', packingReminder: true };

export type DocumentType = 'cc' | 'passport' | 'driving' | 'other';

export type TravelDocument = {
  id: ID;
  userId: ID;
  type: DocumentType;
  name: string;
  number: string;
  expiresAt: ISODate;
  photoUri?: string;
};

export type Purpose = 'leisure' | 'work';

export type Activity =
  | 'hiking'
  | 'beach'
  | 'dinner_out'
  | 'meeting'
  | 'museums_formal'
  | 'sport'
  | 'theme_park'
  | 'nightlife';

export type Destination = {
  name: string;
  country: string;
  /** ISO 3166-1 alpha-2 ("IT"). Missing when typed without a search result. */
  countryCode?: string;
  /** Missing when typed without a search result: then there's no weather. */
  lat?: number;
  lon?: number;
};

export type Trip = {
  id: ID;
  userId: ID;
  destination: Destination;
  startDate: ISODate;
  endDate: ISODate;
  adults: number;
  children: number;
  purpose: Purpose;
  activities: Activity[];
  /** Past trip this one was created from ("Usar como base"). */
  basedOnTripId?: ID;
  createdAt: ISODateTime;
};

export type TripStatus = 'upcoming' | 'ongoing' | 'past';

export type Category =
  'Roupa' | 'Higiene' | 'Saúde' | 'Eletrónica' | 'Documentos' | 'Acessórios' | 'Criança' | 'Outros';

export type PackingItem = {
  id: ID;
  tripId: ID;
  name: string;
  category: Category;
  quantity: number;
  packed: boolean;
  buyLater: boolean;
  source: 'generated' | 'manual' | 'history';
};

export type TripEvent = {
  id: ID;
  userId: ID;
  tripId?: ID;
  date: ISODate;
  startTime: ISOTime;
  endTime?: ISOTime;
  title: string;
  location?: string;
  notes?: string;
  kind: 'user' | 'suggested';
  status: 'accepted' | 'pending' | 'dismissed';
};

/** What the user tells us after a trip ends; feeds the Histórico. */
export type TripReview = {
  id: ID;
  tripId: ID;
  forgotten: string[];
  unused: { name: string; qty: number }[];
};

/** Fields every "create" call leaves to the repository. */
export type NewOf<T> = Omit<T, 'id' | 'createdAt'>;
