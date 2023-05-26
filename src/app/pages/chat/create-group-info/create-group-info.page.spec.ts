import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CreateGroupInfoPage } from './create-group-info.page';

describe('CreateGroupInfoPage', () => {
  let component: CreateGroupInfoPage;
  let fixture: ComponentFixture<CreateGroupInfoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateGroupInfoPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateGroupInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
