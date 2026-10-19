import { differenceInCalendarDays, parseISO } from 'date-fns';

import type { TravelDocument, Trip } from '@/data/types';

import { needsPassport } from './countries';

// What needs the user's attention, document-wise, before a trip ("1 doc precisa de atenção").

export type DocumentIssue = { message: string; documentId?: string };

/** Many countries ask for 6 months of passport validity after the trip. */
const PASSPORT_MARGIN_DAYS = 180;

export function documentIssues(docs: TravelDocument[], trip: Trip): DocumentIssue[] {
  const issues: DocumentIssue[] = [];
  const passportNeeded = needsPassport(trip.destination.countryCode);
  const relevant = docs.filter((d) =>
    passportNeeded ? d.type === 'passport' : d.type === 'cc' || d.type === 'passport',
  );

  if (relevant.length === 0) {
    issues.push({
      message: passportNeeded
        ? `Precisas de passaporte para ${trip.destination.country || trip.destination.name} e ainda não o guardaste.`
        : 'Ainda não guardaste o Cartão de Cidadão nem o passaporte.',
    });
  }

  for (const doc of relevant) {
    if (doc.expiresAt < trip.endDate) {
      issues.push({
        documentId: doc.id,
        message: `${doc.name} expira antes do fim da viagem.`,
      });
    } else if (
      doc.type === 'passport' &&
      passportNeeded &&
      differenceInCalendarDays(parseISO(doc.expiresAt), parseISO(trip.endDate)) <
        PASSPORT_MARGIN_DAYS
    ) {
      issues.push({
        documentId: doc.id,
        message: `${doc.name} fica com menos de 6 meses de validade depois da viagem.`,
      });
    }
  }
  return issues;
}
