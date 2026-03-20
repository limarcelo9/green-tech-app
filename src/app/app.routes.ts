import { Routes } from '@angular/router';
import { AnalyticsComponent } from './analytics/analytics.component';

export const routes: Routes = [
    { path: 'analytics', component: AnalyticsComponent },
    { path: 'analytics/:region', component: AnalyticsComponent },
    { path: '', redirectTo: '/analytics', pathMatch: 'full' }
];
