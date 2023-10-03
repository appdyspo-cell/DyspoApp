import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./pages/login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'tabs',
    loadChildren: () =>
      import('./pages/tabs/tabs.module').then((m) => m.TabsPageModule),
  },
  {
    path: 'parametres',
    loadChildren: () =>
      import('./pages/parametres/parametres.module').then(
        (m) => m.ParametresPageModule
      ),
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./pages/profile/profile.module').then((m) => m.ProfilePageModule),
  },
  {
    path: 'friends',
    loadChildren: () => import('./pages/friends/friends.module').then( m => m.FriendsPageModule)
  },
  {
    path: 'chat-home',
    loadChildren: () => import('./pages/chat-home/chat-home.module').then( m => m.ChatHomePageModule)
  },
  {
    path: 'agenda',
    loadChildren: () => import('./pages/agenda/agenda.module').then( m => m.AgendaPageModule)
  },
  {
    path: 'user-status',
    loadChildren: () => import('./pages/user-status/user-status.module').then( m => m.UserStatusPageModule)
  },
  {
    path: 'cgu',
    loadChildren: () => import('./pages/cgu/cgu.module').then( m => m.CguPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'group-list',
    loadChildren: () => import('./pages/chat/group-list/group-list.module').then( m => m.GroupListPageModule)
  },
  {
    path: 'group-info',
    loadChildren: () => import('./pages/chat/group-info/group-info.module').then( m => m.GroupInfoPageModule)
  },
  {
    path: 'group-chatting',
    loadChildren: () => import('./pages/chat/group-chatting/group-chatting.module').then( m => m.GroupChattingPageModule)
  },
  {
    path: 'create-group',
    loadChildren: () => import('./pages/chat/create-group/create-group.module').then( m => m.CreateGroupPageModule)
  },
  {
    path: 'create-group-info',
    loadChildren: () => import('./pages/chat/create-group-info/create-group-info.module').then( m => m.CreateGroupInfoPageModule)
  },
  {
    path: 'pro-calendar',
    loadChildren: () => import('./pages/pro-calendar/pro-calendar.module').then( m => m.ProCalendarPageModule)
  },

];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
