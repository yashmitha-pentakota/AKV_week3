import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileimportService {

  private apiUrl = 'http://localhost:5000/api/files/progress';  // Adjust the URL based on your server configuration
  private retryUrl = 'http://localhost:5000/api/files/retry'; 

  constructor(private http: HttpClient) {}

  // Method for uploading the file to S3
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<any>('/api/upload', formData);  // Make sure to handle backend logic
  }
}
