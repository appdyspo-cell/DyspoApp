import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

export interface CalendarOnboardingResult {
  withKids: boolean;
  custodyDays?: boolean[]; // uniquement si withKids === true
}

@Component({
  selector: 'app-calendar-onboarding-modal',
  templateUrl: './calendar-onboarding-modal.component.html',
  styleUrls: ['./calendar-onboarding-modal.component.scss'],
  standalone: false,
})
export class CalendarOnboardingModalComponent implements OnInit {
  step: 'kids-question' | 'custody-picker' = 'kids-question';

  /** L-M-M-J-V-S-D */
  readonly weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  /** 14 jours (sem 1 + sem 2) — true = jour de garde */
  custodyDays: boolean[] = new Array(14).fill(false);

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  chooseYes() {
    this.step = 'custody-picker';
  }

  chooseNo() {
    // Calendrier tout vert : custodyDays vides → applyCustodySchedule rend tout DYSPO
    this.dismiss({ withKids: false });
  }

  toggleDay(index: number) {
    this.custodyDays[index] = !this.custodyDays[index];
  }

  confirmCustody() {
    if (!this.custodyDays.includes(true)) return;
    this.dismiss({ withKids: true, custodyDays: [...this.custodyDays] });
  }

  private dismiss(result: CalendarOnboardingResult) {
    this.modalCtrl.dismiss(result);
  }
}
