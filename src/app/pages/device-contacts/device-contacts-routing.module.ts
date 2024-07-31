import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DeviceContactsPage } from './device-contacts.page';

const routes: Routes = [
  {
    path: '',
    component: DeviceContactsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeviceContactsPageRoutingModule {}
