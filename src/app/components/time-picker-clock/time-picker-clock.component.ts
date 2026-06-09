import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

interface ClockItem {
  value: number;
  top: number;
  left: number;
}

@Component({
  selector: 'app-time-picker-clock',
  standalone: false,
  templateUrl: './time-picker-clock.component.html',
  styleUrls: ['./time-picker-clock.component.scss'],
})
export class TimePickerClockComponent implements OnInit, OnChanges {
  @Input() hour = 12;
  @Input() minute = 0;
  @Output() confirmed = new EventEmitter<{ hour: number; minute: number }>();
  @Output() cancelled = new EventEmitter<void>();

  mode: 'hours' | 'minutes' = 'hours';
  selectedHour = 12;
  selectedMinute = 0;

  outerHourItems: ClockItem[] = [];
  innerHourItems: ClockItem[] = [];
  minuteItems: ClockItem[] = [];

  private readonly HALF = 128; // demi-taille du cadran (256px)

  ngOnChanges(changes: SimpleChanges) {
    if (changes['hour']) this.selectedHour = this.hour;
    if (changes['minute']) this.selectedMinute = this.minute;
    this.mode = 'hours';
  }

  ngOnInit() {
    // Anneau extérieur : 12, 1, 2, …, 11
    this.outerHourItems = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((v, i) =>
      this.makeItem(v, i, 98)
    );
    // Anneau intérieur : 0, 13, 14, …, 23
    this.innerHourItems = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((v, i) =>
      this.makeItem(v, i, 62)
    );
    // Minutes : 00, 05, …, 55
    this.minuteItems = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((v, i) =>
      this.makeItem(v, i, 98)
    );
  }

  private makeItem(value: number, index: number, radius: number): ClockItem {
    const a = (index * 30 * Math.PI) / 180;
    return {
      value,
      top: this.HALF - radius * Math.cos(a),
      left: this.HALF + radius * Math.sin(a),
    };
  }

  get formattedHour(): string {
    return this.selectedHour.toString().padStart(2, '0');
  }

  get formattedMinute(): string {
    return this.selectedMinute.toString().padStart(2, '0');
  }

  get handAngle(): number {
    if (this.mode === 'hours') {
      const h = this.selectedHour;
      const idx = h === 0 || h === 12 ? 0 : h < 12 ? h : h - 12;
      return idx * 30;
    }
    return (this.selectedMinute / 5) * 30;
  }

  get handLength(): number {
    if (this.mode === 'hours') {
      return this.selectedHour === 0 || this.selectedHour >= 13 ? 62 : 98;
    }
    return 98;
  }

  get handTransform(): string {
    return `translateX(-50%) rotate(${this.handAngle}deg)`;
  }

  isHourSelected(v: number): boolean {
    return this.selectedHour === v;
  }

  isMinuteSelected(v: number): boolean {
    return this.selectedMinute === v;
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  selectHour(h: number) {
    this.selectedHour = h;
    setTimeout(() => {
      this.mode = 'minutes';
    }, 220);
  }

  selectMinute(m: number) {
    this.selectedMinute = m;
  }

  confirm() {
    this.confirmed.emit({ hour: this.selectedHour, minute: this.selectedMinute });
  }

  cancel() {
    this.cancelled.emit();
  }
}
