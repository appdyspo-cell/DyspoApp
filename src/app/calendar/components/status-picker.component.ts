import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UserDyspoStatus } from 'src/app/models/models';

@Component({
  selector: 'app-status-picker',
  standalone: false,
  template: `
    <div class="sp-wrapper">
      <div class="sp-handle-bar"></div>

      <div class="sp-title">Mon statut</div>

      <div class="sp-options">

        <button class="sp-btn dyspo" (click)="pick(S.DYSPO)">
          <div class="sp-icon">✓</div>
          <span>Dyspo&nbsp;!</span>
        </button>

        <button *ngIf="hasKids" class="sp-btn kids" (click)="pick(S.DYSPOWITHKIDS)">
          <div class="sp-icon">👶</div>
          <span>Avec enfants</span>
        </button>

        <button class="sp-btn nodyspo" (click)="pick(S.NODYSPO)">
          <div class="sp-icon">✕</div>
          <span>Pas dyspo</span>
        </button>

      </div>

      <button class="sp-clear" (click)="pick(S.UNDEFINED)">
        Effacer la sélection
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .sp-wrapper {
      padding: 12px 20px 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .sp-handle-bar {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--d-surface-3);
      margin-bottom: 18px;
    }

    .sp-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--d-text-primary);
      margin-bottom: 24px;
      letter-spacing: -0.1px;
    }

    .sp-options {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-bottom: 28px;
    }

    .sp-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      -webkit-tap-highlight-color: transparent;

      .sp-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        font-weight: 700;
        color: #fff;
        transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      span {
        font-size: 12px;
        font-weight: 600;
        color: var(--d-text-secondary);
      }

      &:active .sp-icon {
        transform: scale(0.88);
      }

      &.dyspo .sp-icon     { background: var(--d-dyspo-dark); }
      &.kids .sp-icon      { background: var(--d-dyspo-kids-dark); }
      &.nodyspo .sp-icon   { background: var(--d-no-dyspo); }
    }

    .sp-clear {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 13px;
      color: var(--d-text-tertiary);
      padding: 4px 12px;
      border-radius: 20px;
      transition: color 0.15s;
      -webkit-tap-highlight-color: transparent;

      &:active { color: var(--d-text-secondary); }
    }
  `],
})
export class StatusPickerComponent {
  @Input() hasKids = false;
  S = UserDyspoStatus;

  constructor(private modalCtrl: ModalController) {}

  pick(status: UserDyspoStatus) {
    this.modalCtrl.dismiss(status);
  }

  dismiss() {
    this.modalCtrl.dismiss(null);
  }
}
