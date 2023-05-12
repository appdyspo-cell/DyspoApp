import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserStatusPage } from './user-status.page';

describe('UserStatusPage', () => {
  let component: UserStatusPage;
  let fixture: ComponentFixture<UserStatusPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(UserStatusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
