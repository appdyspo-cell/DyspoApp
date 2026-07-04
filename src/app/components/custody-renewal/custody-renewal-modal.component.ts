import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

export type CustodyRenewalAction = 'keep' | 'update' | 'later';

export interface CustodyRenewalResult {
  action: CustodyRenewalAction;
  newCustodyDays?: boolean[];
}

@Component({
  selector: 'app-custody-renewal-modal',
  templateUrl: './custody-renewal-modal.component.html',
  styleUrls: ['./custody-renewal-modal.component.scss'],
  standalone: false,
})
export class CustodyRenewalModalComponent implements OnInit {
  @Input() currentCustodyDays: boolean[] = new Array(14).fill(false);
  @Input() daysLeft: number = 7;

  step: 'choice' | 'edit' = 'choice';
  editDays: boolean[] = [];
  readonly weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.editDays = [...this.currentCustodyDays];
  }

  keepSameSchedule() {
    this.dismiss({ action: 'keep' });
  }

  openEdit() {
    this.editDays = [...this.currentCustodyDays];
    this.step = 'edit';
  }

  toggleDay(index: number) {
    this.editDays[index] = !this.editDays[index];
  }

  validateEdit() {
    if (!this.editDays.includes(true)) return;
    this.dismiss({ action: 'update', newCustodyDays: [...this.editDays] });
  }

  later() {
    this.dismiss({ action: 'later' });
  }

  private dismiss(result: CustodyRenewalResult) {
    this.modalCtrl.dismiss(result);
  }
}
