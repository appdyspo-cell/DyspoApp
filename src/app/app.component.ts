import { Component } from '@angular/core';
import { Auth, User, authState, user } from '@angular/fire/auth';
import { NavController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  userSubscription: Subscription;
  user$: Observable<User | null>;
  authState$: Observable<User | null>;
  authStateSubscription: Subscription;

  constructor(private auth: Auth, private navController: NavController) {
    this.user$ = user(auth);
    this.authState$ = authState(auth);
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
      //handle user state changes here. Note, that user will be null if there is no currently logged in user.
      console.log(aUser);
      if (aUser) {
        this.navController.navigateRoot('/tabs');
      }
    });
    this.authStateSubscription = this.authState$.subscribe(
      (aUser: User | null) => {
        //handle auth state changes here. Note, that user will be null if there is no currently logged in user.
        console.log(aUser);
        if (aUser) {
          this.navController.navigateRoot('/tabs');
        }
      }
    );
  }

  ngOnDestroy() {
    // when manually subscribing to an observable remember to unsubscribe in ngOnDestroy
    this.authStateSubscription.unsubscribe();
    this.userSubscription.unsubscribe();
  }
}
