import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DeviceContactsPage } from './device-contacts.page';

describe('DeviceContactsPage', () => {
  let component: DeviceContactsPage;
  let fixture: ComponentFixture<DeviceContactsPage>;

  beforeEach(waitForAsync () => {
    fixture = TestBed.createComponent(DeviceContactsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
