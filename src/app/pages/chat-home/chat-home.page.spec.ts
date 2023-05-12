import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatHomePage } from './chat-home.page';

describe('ChatHomePage', () => {
  let component: ChatHomePage;
  let fixture: ComponentFixture<ChatHomePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ChatHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
