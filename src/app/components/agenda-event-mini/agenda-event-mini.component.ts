import { Component, Input, OnInit } from '@angular/core';
import { AgendaEvent, AgendaEventType } from 'src/app/models/models';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-agenda-event-mini',
  templateUrl: './agenda-event-mini.component.html',
  styleUrls: ['./agenda-event-mini.component.scss'],
})
export class AgendaEventMiniComponent implements OnInit {
  @Output() outevt = new EventEmitter<string>();
  @Input() agendaEvent!: AgendaEvent;
  agendaEventType = AgendaEventType;

  constructor() {}

  ngOnInit() {}

  addNewItem(value: string) {
    this.outevt.emit(value);
  }
}
