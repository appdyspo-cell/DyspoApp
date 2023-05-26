import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CreateGroupInfoPage } from './create-group-info.page';

const routes: Routes = [
  {
    path: '',
    component: CreateGroupInfoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreateGroupInfoPageRoutingModule {}
