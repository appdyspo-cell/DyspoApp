import { Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { format, parseISO } from 'date-fns';
import { AgendaEvent } from 'src/app/models/models';

@Injectable({ providedIn: 'root' })
export class CalendarService {

  constructor(private actionSheetCtrl: ActionSheetController) {}

  async promptAddToCalendar(event: AgendaEvent) {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Ajouter à mon calendrier',
      buttons: [
        {
          text: 'Google Agenda',
          icon: 'logo-google',
          handler: () => {
            this.openGoogleCalendar(event);
            return true;
          },
        },
        {
          text: 'Calendrier Apple / Outlook (.ics)',
          icon: 'calendar-outline',
          handler: () => {
            this.exportICS(event);
            return true;
          },
        },
        {
          text: 'Annuler',
          role: 'cancel',
          icon: 'close-outline',
        },
      ],
    });
    await sheet.present();
  }

  // ── Google Calendar ────────────────────────────────────────────────────────

  private openGoogleCalendar(event: AgendaEvent) {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title || 'Événement dyspo',
      dates: `${this.toGcalDate(event.startISO)}/${this.toGcalDate(event.endISO)}`,
    });
    if (event.place_description) {
      params.set('location', event.place_description);
    }
    window.open(
      `https://calendar.google.com/calendar/render?${params.toString()}`,
      '_blank'
    );
  }

  private toGcalDate(iso: string): string {
    return format(parseISO(iso), "yyyyMMdd'T'HHmmss");
  }

  // ── iCal (.ics) ───────────────────────────────────────────────────────────

  private async exportICS(event: AgendaEvent) {
    const icsContent = this.generateICS(event);
    const filename = `${(event.title || 'evenement')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()}.ics`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });

    // Web Share API: works on iOS (WKWebView) and modern Android WebView
    if (navigator.canShare) {
      const file = new File([blob], filename, { type: 'text/calendar' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: event.title || 'Événement' });
          return;
        } catch {
          // cancelled or unsupported — fall through to download
        }
      }
    }

    // Fallback: download in browser
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private generateICS(event: AgendaEvent): string {
    const now = format(new Date(), "yyyyMMdd'T'HHmmss");
    const start = format(parseISO(event.startISO), "yyyyMMdd'T'HHmmss");
    const end = format(parseISO(event.endISO), "yyyyMMdd'T'HHmmss");

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dyspo//Dyspo App//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `DTSTAMP:${now}`,
      `UID:${event.uid || now}@dyspo.app`,
      `SUMMARY:${this.escapeICS(event.title || 'Événement dyspo')}`,
    ];

    if (event.place_description) {
      lines.push(`LOCATION:${this.escapeICS(event.place_description)}`);
    }

    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.join('\r\n');
  }

  private escapeICS(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }
}
