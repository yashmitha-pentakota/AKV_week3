import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './features/auth/components/login/login.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { DashboardComponent } from './features/auth/components/dashboard/dashboard.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { from } from 'rxjs';
import { FileService } from 'src/app/core/services/file.service';
import { saveAs } from 'file-saver';
import { FileUploadComponent } from './features/auth/components/dashboard/fileupload/fileupload.component';
import { Router, RouterModule, Routes } from '@angular/router';
import { rootCertificates } from 'tls';
import { CommonModule } from '@angular/common';
import { ImportfileComponent} from './importfile/importfile.component';
import { ChatComponent } from './features/chat/chat.component';

const routes: Routes = [
  { path: 'importfile', component: ImportfileComponent }
];
@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    DashboardComponent,
    FileUploadComponent,
    ImportfileComponent,
    ChatComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
     BrowserAnimationsModule, 
     FormsModule,
     ToastrModule.forRoot(),
     CommonModule,
     ReactiveFormsModule,
     RouterModule.forRoot(routes)
  ],
  exports: [RouterModule],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },],
  bootstrap: [AppComponent]
})
export class AppModule { }