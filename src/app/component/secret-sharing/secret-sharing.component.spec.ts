import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretSharingComponent } from './secret-sharing.component';

describe('SecretSharingComponent', () => {
  let component: SecretSharingComponent;
  let fixture: ComponentFixture<SecretSharingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecretSharingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecretSharingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
