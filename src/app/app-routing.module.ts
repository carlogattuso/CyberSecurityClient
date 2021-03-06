import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AppComponent} from './app.component';
import {DashboardComponent} from './component/dashboard/dashboard.component';
import {NonRepudiationComponent} from "./component/non-repudiation/non-repudiation.component";
import {HomomorphismComponent} from "./component/homomorphism/homomorphism.component";



const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'nr',
    component: NonRepudiationComponent
  },
  {
    path: 'homomorphism',
    component: HomomorphismComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

