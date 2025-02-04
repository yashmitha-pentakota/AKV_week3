import { TestBed } from '@angular/core/testing';

import { FileimportService } from './fileimport.service';

describe('FileimportService', () => {
  let service: FileimportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileimportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
