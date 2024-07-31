import { Pipe, PipeTransform } from '@angular/core';
import { format, parseISO } from 'date-fns';
import fr from 'date-fns/locale/fr';

@Pipe({
  name: 'dateChatFormat',
})
export class DateChatFormatPipe implements PipeTransform {
  transform(dateISO: string): string {
    return format(parseISO(dateISO), 'HH:mm dd MMM', { locale: fr });
  }
}
