import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { GroupChattingPage } from './group-chatting.page';

describe('GroupChattingPage', () => {
  let component: GroupChattingPage;
  let fixture: ComponentFixture<GroupChattingPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupChattingPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(GroupChattingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
