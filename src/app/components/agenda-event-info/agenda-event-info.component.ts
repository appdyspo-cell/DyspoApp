import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AgendaEvent, AgendaEventType } from 'src/app/models/models';

@Component({
  selector: 'app-agenda-event-info',
  templateUrl: './agenda-event-info.component.html',
  styleUrls: ['./agenda-event-info.component.scss'],
})
export class AgendaEventInfoComponent implements OnInit {
  @Output() outevt = new EventEmitter<string>();
  @Input() agendaEvent!: AgendaEvent;
  agendaEventType = AgendaEventType;
  constructor() {}

  ngOnInit() {}

  onProfile() {}
}
