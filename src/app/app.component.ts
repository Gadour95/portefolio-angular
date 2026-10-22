import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  template: `
    <p-toast position="top-center" />
    <p-toast key="auth" position="bottom-center" />

    <router-outlet />
  `
})
export class AppComponent {}