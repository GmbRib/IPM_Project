import type { PackingItem, TravelDocument, Trip, TripEvent, TripReview } from '../../types';
import type { Repositories } from '../types';
import { localAuth } from './auth';
import { createLocalCollection } from './collection';
import { writeDemoData } from './seed';

const documents = createLocalCollection<TravelDocument, 'userId'>('documents');
const trips = createLocalCollection<Trip, 'userId'>('trips', { timestamps: true });
const packing = createLocalCollection<PackingItem, 'tripId'>('packing');
const events = createLocalCollection<TripEvent, 'userId' | 'tripId'>('events');
const reviews = createLocalCollection<TripReview, 'tripId'>('reviews');

export const localRepositories: Repositories = {
  auth: localAuth,
  documents,
  trips,
  packing,
  events,
  reviews,
  async resetToDemo() {
    await writeDemoData();
    [documents, trips, packing, events, reviews].forEach((c) => c.invalidate());
  },
};
