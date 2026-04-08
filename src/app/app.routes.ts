import { Routes } from "@angular/router";
import { AnalyticsComponent } from "./analytics/analytics.component";
import { ConteudoComponent } from "./conteudo/conteudo.component";

export const routes: Routes = [
    { path: "analytics", component: AnalyticsComponent },
    { path: "analytics/:region", component: AnalyticsComponent },
    { path: "conteudo", component: ConteudoComponent },
    { path: "", redirectTo: "/analytics", pathMatch: "full" }
];
