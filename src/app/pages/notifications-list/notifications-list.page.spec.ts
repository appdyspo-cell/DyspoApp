import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NotificationsListPage } from './notifications-list.page';

describe('NotificationsListPage', () => {
  let component: NotificationsListPage;
  let fixture: ComponentFixture<NotificationsListPage>;

  beforeEach(waitForAsync () => {
    fixture = TestBed.createComponent(NotificationsListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
