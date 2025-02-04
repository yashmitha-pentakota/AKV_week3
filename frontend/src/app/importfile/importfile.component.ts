import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FileimportService } from '../core/services/fileimport.service'
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-importfile',
  templateUrl: './importfile.component.html',
  styleUrls: ['./importfile.component.scss']
})
export class ImportfileComponent implements OnInit {



  importFiles: any[] = [];
 
  constructor(private router: Router, private http: HttpClient) { }
 
  ngOnInit(): void {
    // Fetch the import files from the backend when the component initializes
    this.fetchImportFiles();
  }
 
  fetchImportFiles() {
    // Correct string interpolation for the URL
    this.http.get(`${environment.apiUrl}/auth/retrieve-files`).subscribe(
      (files) => {
        this.importFiles = files as any[];
      },
      (error) => {
        console.error('Error fetching import files:', error);
      }
    );
  }
 
  downloadErrorFile(errorFileUrl: string | null) {
    console.log(errorFileUrl);
    if (!errorFileUrl) {
      console.error('Error: Invalid error file URL');
      return;
    }
  
    console.log('#####');
    const link = document.createElement('a');
    link.href = errorFileUrl;
    link.download = errorFileUrl.split('/').pop() || 'default-filename'; 
    link.click();
  }
  
  redirecttodashboard(){
    this.router.navigate(['./dashboard']);
  }
 
}