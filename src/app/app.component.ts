import { Component } from '@angular/core';
import { Auth, User, authState, user } from '@angular/fire/auth';
import { MenuController, NavController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  //userSubscription: Subscription;
  user$: Observable<User | null>;
  authState$: Observable<User | null>;
  authStateSubscription: Subscription;

  constructor(
    private auth: Auth,
    private navController: NavController,
    private menuCtrl: MenuController
  ) {
    this.user$ = user(auth);
    this.authState$ = authState(auth);

    // this.userSubscription = this.user$.subscribe((aUser: User | null) => {
    //   //handle user state changes here. Note, that user will be null if there is no currently logged in user.
    //   console.log(aUser);
    //   if (aUser) {
    //     this.navController.navigateRoot('/tabs');
    //   }
    // });
    this.authStateSubscription = this.authState$.subscribe(
      (aUser: User | null) => {
        //handle auth state changes here. Note, that user will be null if there is no currently logged in user.
        console.log(aUser);
        if (aUser) {
          this.navController.navigateRoot('/tabs');
        } else {
          console.log('navigateRoot: Login');
          this.navController.navigateRoot('/login');

          this.menuCtrl.enable(false);
          localStorage.clear();
          //this.killAllServices();
          //this.userSvc.unsubscribeUserInfo();
        }
      }
    );
  }

  ngOnDestroy() {
    // when manually subscribing to an observable remember to unsubscribe in ngOnDestroy
    this.authStateSubscription.unsubscribe();
    //this.userSubscription.unsubscribe();
  }
}
