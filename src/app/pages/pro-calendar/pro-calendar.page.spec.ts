import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ProCalendarPage } from './pro-calendar.page';

describe('ProCalendarPage', () => {
  let component: ProCalendarPage;
  let fixture: ComponentFixture<ProCalendarPage>;

  beforeEach(waitForAsync () => {
    fixture = TestBed.createComponent(ProCalendarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
