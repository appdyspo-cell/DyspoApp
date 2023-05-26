import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'user-status',
        loadChildren: () =>
          import('../user-status/user-status.module').then(
            (m) => m.UserStatusPageModule
          ),
      },
      {
        path: 'group-list',
        loadChildren: () =>
          import('../chat/group-list/group-list.module').then(
            (m) => m.GroupListPageModule
          ),
      },
      {
        path: 'agenda',
        loadChildren: () =>
          import('../agenda/agenda.module').then((m) => m.AgendaPageModule),
      },
      {
        path: 'friends',
        loadChildren: () =>
          import('../friends/friends.module').then((m) => m.FriendsPageModule),
      },
      {
        path: 'parametres',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../parametres/parametres.module').then(
                (m) => m.ParametresPageModule
              ),
          },
          {
            path: 'profile',
            loadChildren: () =>
              import('../profile/profile.module').then(
                (m) => m.ProfilePageModule
              ),
          },
        ],
      },
      {
        path: '',
        redirectTo: '/tabs/user-status',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/user-status',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
