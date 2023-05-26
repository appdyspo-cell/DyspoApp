import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GroupChattingPage } from './group-chatting.page';

const routes: Routes = [
  {
    path: '',
    component: GroupChattingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupChattingPageRoutingModule {}
