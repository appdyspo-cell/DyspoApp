import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FixContactsPage } from './fix-contacts.page';

const routes: Routes = [
  {
    path: '',
    component: FixContactsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FixContactsPageRoutingModule {}
