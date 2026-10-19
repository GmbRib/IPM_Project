import { BookUser, Car, FileText, IdCard, type LucideIcon } from 'lucide-react-native';

import type { Activity, Category, DocumentType, Purpose } from '@/data/types';

export const DOCUMENT_TYPES: Record<DocumentType, { label: string; icon: LucideIcon }> = {
  cc: { label: 'Cartão de Cidadão', icon: IdCard },
  passport: { label: 'Passaporte', icon: BookUser },
  driving: { label: 'Carta de Condução', icon: Car },
  other: { label: 'Outro documento', icon: FileText },
};

export const ALLERGY_SUGGESTIONS = ['Pólen', 'Ácaros', 'Amendoim', 'Glúten', 'Lactose', 'Marisco'];
export const MEDICATION_SUGGESTIONS = ['Anti-histamínico', 'Insulina', 'Inalador'];

export const PURPOSES: Record<Purpose, string> = { leisure: 'Lazer', work: 'Trabalho' };

/** In the order shown in "O que vais fazer?". */
export const ACTIVITIES: { value: Activity; label: string }[] = [
  { value: 'hiking', label: 'Caminhadas' },
  { value: 'beach', label: 'Praia' },
  { value: 'dinner_out', label: 'Jantar fora' },
  { value: 'meeting', label: 'Reuniões' },
  { value: 'museums_formal', label: 'Museus e formal' },
  { value: 'sport', label: 'Desporto' },
  { value: 'theme_park', label: 'Parque temático' },
  { value: 'nightlife', label: 'Vida noturna' },
];

/** Packing categories in display order. */
export const CATEGORIES: Category[] = [
  'Documentos',
  'Roupa',
  'Higiene',
  'Saúde',
  'Eletrónica',
  'Acessórios',
  'Criança',
  'Outros',
];

export const paxLabel = (adults: number, children: number) => {
  const n = adults + children;
  return `${n} ${n === 1 ? 'pessoa' : 'pessoas'}${children ? ` (${children} ${children === 1 ? 'criança' : 'crianças'})` : ''}`;
};
