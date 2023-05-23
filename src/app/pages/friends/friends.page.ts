import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
} from '@angular/fire/firestore';
import { NavigationExtras, Router } from '@angular/router';
import { AlertController, AnimationController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AppUser, Friend, FriendStatus } from 'src/app/models/models';
import { FriendsService } from 'src/app/services/friends.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.page.html',
  styleUrls: ['./friends.page.scss'],
})
export class FriendsPage implements OnInit {
  selectSegment = 'friends';
  rate = 3;
  uid: any;

  friends$: Observable<Friend[]>;
  friendsSuggested$: Observable<Friend[]>;
  friendsSubscribtion: any;
  friends: Friend[] = [];
  friendsSuggested: Friend[] = [];

  constructor(
    public utils: UtilsService,
    public alertCtrl: AlertController,
    private firestore: Firestore,
    public route: Router,
    private userSvc: UserService,
    public friendService: FriendsService,
    public animationCtrl: AnimationController
  ) {
    this.friends$ = this.friendService.friends;
    this.friendsSuggested$ = this.friendService.friendsSuggested$;
    this.friends$.subscribe((friends) => {
      this.friends = friends;
    });
    this.friendsSuggested$.subscribe((friendsSuggested) => {
      this.friendsSuggested = friendsSuggested;
    });
    // const friendsCollectionRef = collection(
    //   this.firestore,
    //   `friends/${this.userSvc.userInfo?.uid}/friend_list`
    // );
    // const qFriends = query(
    //   friendsCollectionRef,
    //   where('friend_status', '==', FriendStatus.FRIEND)
    // );
    // const qFriendsSuggested = query(
    //   friendsCollectionRef,
    //   where('friend_status', '==', FriendStatus.PENDING)
    // );

    // this.friends$ = collectionData(qFriends) as Observable<Friend[]>;
    // this.friendsSuggested$ = collectionData(qFriendsSuggested) as Observable<
    //   Friend[]
    // >;
  }

  ngOnInit() {}

  promptDeleteFriend(friend: Friend, i: number) {
    this.alertCtrl
      .create({
        header: 'Suppression',
        //subHeader: 'Size Selection',
        message: 'Etes-vous sur de vouloir retirer cet ami de votre liste ?',

        buttons: [
          {
            text: 'Annuler',
            handler: (data: any) => {
              console.log('Canceled', data);
              const slidingItem = document.getElementById(
                'slidingItem' + i
              ) as any;
              slidingItem.close();
            },
          },
          {
            text: 'Oui',
            handler: (data: any) => {
              const slidingItem = document.getElementById(
                'slidingItem' + i
              ) as any;
              this.deleteFriend(friend, slidingItem);
            },
          },
        ],
      })
      .then((res) => {
        res.present();
      });
  }

  async deleteFriend(friend: Friend, listElement: any) {
    const animationDeleteItem = this.animationCtrl
      .create()
      .addElement(listElement)
      .duration(600)
      .iterations(1)
      .fromTo('height', '100px', 0)
      .fromTo('transform', 'translateX(0px)', 'translateX(-1050px)')
      .fromTo('opacity', 1, 0);

    animationDeleteItem.play();
    this.friendService.deleteFriend(friend, listElement);
    this.utils.showToast('Ami supprimé');
  }

  goToChat(friend: AppUser | undefined, event: any) {
    event.stopPropagation();
    console.log('goToChat', friend);

    if (friend) {
      const navigationExtras: NavigationExtras = {
        state: {
          friendDocId: friend.uid,
          friendUid: friend.uid,
          friendAvatar: friend.avatarPath,
          friendUsername: friend.firstname + ' ' + friend.lastname,
        },
      };
      this.route.navigate(['chatroom'], navigationExtras);
    }
  }

  showProfile(friend: AppUser) {
    //this.utils.showModalPage(AmiFicheComponent, {friendListDoc: friend, userData: friend.userData});
  }

  async addFriend(friend: AppUser, index: number, event: any) {
    event.stopPropagation();
    const slidingItem = document.getElementById('slidingItem' + index) as any;
    this.animateForward(document.querySelector('#add' + index), slidingItem);
    this.friendService.addFriend(friend);
  }

  animateForward(element: any, listElement: any) {
    const animation = this.animationCtrl
      .create()
      .addElement(element)
      .duration(500)
      .iterations(1)
      .keyframes([
        { offset: 0, transform: 'scale(1) rotate(0)' },
        { offset: 0.5, transform: 'scale(1.2) rotate(360deg)' },
        { offset: 1, transform: 'scale(0.1) rotate(360deg)' },
      ]);

    animation.play();

    const animationDeleteItem = this.animationCtrl
      .create()
      .addElement(listElement)
      .duration(600)
      .iterations(1)
      .fromTo('height', '100px', 0)
      .fromTo('transform', 'translateX(0px)', 'translateX(-1050px)')
      .fromTo('opacity', 1, 0);

    animation.onFinish(() => {
      animationDeleteItem.play();
      this.utils.showToast('Ami ajouté');
      console.log('Add friend ');
    });
  }
}
