import { TestBed } from '@angular/core/testing';

import { HomomorphismService } from './homomorphism.service';

describe('HomomorphismService', () => {
  let service: HomomorphismService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HomomorphismService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
