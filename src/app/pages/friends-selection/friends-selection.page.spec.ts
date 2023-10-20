import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FriendsSelectionPage } from './friends-selection.page';

describe('FriendsSelectionPage', () => {
  let component: FriendsSelectionPage;
  let fixture: ComponentFixture<FriendsSelectionPage>;

  beforeEach(waitForAsync () => {
    fixture = TestBed.createComponent(FriendsSelectionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
