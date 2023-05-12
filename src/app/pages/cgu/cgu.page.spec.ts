import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CguPage } from './cgu.page';

describe('CguPage', () => {
  let component: CguPage;
  let fixture: ComponentFixture<CguPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(CguPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
