import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as JSZip from 'jszip';
import { timeout } from 'rxjs/operators';
import { saveAs } from 'file-saver';
 
@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = `http://localhost:5001/api/files`;
 
  constructor(private http: HttpClient) {}
 
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
 
  generatePresignedUrl(fileName: string, fileType: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/generate-upload-url`, {
      fileName,
      fileType
    }, { headers });
  }
 
  // uploadToS3(uploadUrl: string, file: File): Observable<any> {
  //   const headers = new HttpHeaders()
  //     .set('Content-Type', file.type)
  //     .set('Skip-Auth', 'true');
  //   console.log('uploadUrl:', uploadUrl);
  //   return this.http.put(uploadUrl, file, { headers }).pipe(
  //     timeout(50000) 
  //   );
  // }
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
  
    return this.http.post(`${this.apiUrl}/upload-file`, formData).pipe(
      timeout(50000), // Set a timeout if needed
    );
  }
  async downloadFiles(fileNames: string[]): Promise<void> {
    const headers = this.getAuthHeaders();
   
    try {
      const response = await this.http.post<any>(
        `${this.apiUrl}/download`,
        { fileNames },
        { headers }
      ).toPromise();
 
      if (fileNames.length === 1) {
        // Single file download
        const fileResponse = await fetch(response.downloadUrl);
        const blob = await fileResponse.blob();
        saveAs(blob, fileNames[0]); // Use the original filename
      } else {
        // Multiple files - create zip
        const zip = new JSZip();
        const downloadPromises = response.downloadUrls.map(async (item: { fileName: string, downloadUrl: string }) => {
          const fileResponse = await fetch(item.downloadUrl);
          const blob = await fileResponse.blob();
          zip.file(item.fileName, blob);
        });
 
        await Promise.all(downloadPromises);
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'downloaded_files.zip');
      }
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }
 
  getAllFiles(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/list`, { headers });
  }
  getFilePreviewUrl(fileName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/preview/${fileName}`);
  }
  
}