import {
  bootstrapApplication
} from '@angular/platform-browser';

import {
  registerLocaleData
} from '@angular/common';

import localeFr from '@angular/common/locales/fr';
import localeAr from '@angular/common/locales/ar';
import localeEn from '@angular/common/locales/en';

import {
  AppComponent
} from './app/app.component';

import {
  appConfig
} from './app/app.config';

registerLocaleData(localeFr, 'fr');
registerLocaleData(localeAr, 'ar');
registerLocaleData(localeEn, 'en-US');

bootstrapApplication(
  AppComponent,
  appConfig
).catch(error => {
  console.error(error);
});