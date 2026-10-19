import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

/** "27/10/2026" */
export const formatDate = (d: Date) => format(d, 'dd/MM/yyyy', { locale: pt });
/** "14:30" */
export const formatTime = (d: Date) => format(d, 'HH:mm', { locale: pt });
