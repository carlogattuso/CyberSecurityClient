import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomomorphismComponent } from './homomorphism.component';

describe('HomomorphismComponent', () => {
  let component: HomomorphismComponent;
  let fixture: ComponentFixture<HomomorphismComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomomorphismComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomomorphismComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
