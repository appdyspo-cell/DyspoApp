import { Pipe, PipeTransform } from '@angular/core';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

@Pipe({
  name: 'dayDateFormat',
})
export class DayNumberFormatPipe implements PipeTransform {
  transform(dateISO: string): string {
    return format(parseISO(dateISO), 'dd MMM', { locale: fr });
  }
}
