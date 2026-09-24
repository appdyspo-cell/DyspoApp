import { Injectable } from '@angular/core';
import { ActionSheetController, Platform } from '@ionic/angular';
import { Device } from '@capacitor/device';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { format, parseISO } from 'date-fns';
import { AgendaEvent } from 'src/app/models/models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class CalendarService {

  /** URL de base Firebase Hosting selon l'environnement */
  private readonly hostingBase = environment.production
    ? 'https://dyspo-2bb43.web.app'
    : 'https://dyspo-test.web.app';

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private platform: Platform,
  ) {}

  async promptAddToCalendar(event: AgendaEvent) {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Ajouter à mon calendrier',
      cssClass: 'dyspo-sheet',
      buttons: [
        {
          text: 'Google Agenda',
          icon: 'logo-google',
          handler: () => {
            this.openGoogleCalendar(event);
            return true;
          },
        },
        this.platform.is('ios') && this.platform.is('capacitor')
          ? {
            text: 'Calendrier iPhone',
            icon: 'calendar-outline',
            handler: () => {
              this.addToNativeCalendar(event);
              return true;
            },
          }
          : {
            text: 'Calendrier Apple / Outlook',
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
    const webLink = `${this.hostingBase}/event/${event.uid}`;

    // Construction manuelle de l'URL pour éviter que URLSearchParams encode
    // le lien HTTPS en https%3A%2F%2F… ce qui empêche la détection auto de lien
    // dans l'app Google Agenda Android.
    // Le lien est placé EN PREMIER, seul sur sa ligne, pour maximiser la
    // reconnaissance par le text-classifier Android.
    const descParts: string[] = [webLink];
    if (event.description) descParts.push(event.description);
    const description = descParts.join('\n\n');

    let url = 'https://calendar.google.com/calendar/render'
      + '?action=TEMPLATE'
      + `&text=${encodeURIComponent(event.title || 'Événement dyspo')}`
      + `&dates=${this.toGcalDate(event.startISO)}/${this.toGcalDate(event.endISO)}`
      + `&details=${encodeURIComponent(description)}`;

    if (event.place_description) {
      url += `&location=${encodeURIComponent(event.place_description)}`;
    }

    window.open(url, '_blank');
  }

  private toGcalDate(iso: string): string {
    return format(parseISO(iso), "yyyyMMdd'T'HHmmss");
  }

  // ── Calendrier natif iOS ───────────────────────────────────────────────────

  /**
   * Ouvre la fiche « Nouvel événement » native d'iOS pré-remplie.
   * L'utilisateur choisit le calendrier puis valide avec « Ajouter ».
   * Sur iOS 17+ aucune permission n'est nécessaire (fiche système hors process) ;
   * avant iOS 17, un accès au calendrier doit être demandé au préalable.
   */
  private async addToNativeCalendar(event: AgendaEvent) {
    try {
      const { osVersion } = await Device.getInfo();
      if (parseInt(osVersion, 10) < 17) {
        const { result } = await CapacitorCalendar.requestWriteOnlyCalendarAccess();
        if (result !== 'granted') {
          // Accès refusé → repli sur le fichier .ics
          await this.exportICS(event);
          return;
        }
      }

      const webLink = `${this.hostingBase}/event/${event.uid}`;
      await CapacitorCalendar.createEventWithPrompt({
        title: event.title || 'Événement dyspo',
        startDate: parseISO(event.startISO).getTime(),
        endDate: parseISO(event.endISO).getTime(),
        location: event.place_description || undefined,
        description: [webLink, event.description].filter(Boolean).join('\n\n'),
        url: webLink,
      });
    } catch (err) {
      console.error('[CalendarService] addToNativeCalendar failed, fallback ICS', err);
      await this.exportICS(event);
    }
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

    const webLink = `${this.hostingBase}/event/${event.uid}`;
    // Lien en premier pour qu'Apple Calendar et Google Calendar le détectent
    const descParts: string[] = [webLink];
    if (event.description) descParts.push(event.description);
    lines.push(`DESCRIPTION:${this.escapeICS(descParts.join('\n\n'))}`);
    // Champ URL dédié → bouton tappable dans Apple Calendar / Outlook
    lines.push(`URL:${webLink}`);

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
