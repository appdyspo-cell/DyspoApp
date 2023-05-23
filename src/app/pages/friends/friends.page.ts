import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  getDocs,
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
  //friendsSuggested$: Observable<Friend[]>;
  friendsSubscribtion: any;
  friends: Friend[] = [];
  friendsSuggested: Friend[] = [];

  inputSearch = '';
  autocompleteItems: AppUser[] = [];
  allOtherUsers: AppUser[] = [];

  constructor(
    public utils: UtilsService,
    public alertCtrl: AlertController,
    private firestore: Firestore,
    public route: Router,
    private userSvc: UserService,
    public friendService: FriendsService,
    public animationCtrl: AnimationController
  ) {
    this.friends$ = this.friendService.friends$;

    this.friends$.subscribe((friends) => {
      console.log('Friends  ', friends);
      this.friends = friends.filter((elt) => elt.friend_status === 'FRIEND');
      this.friendsSuggested = friends.filter(
        (elt) => elt.friend_status === 'SUGGESTED'
      );
    });
    // this.friendsSuggested$.subscribe((friendsSuggested) => {
    //   console.log('Friends suggested ', friendsSuggested);
    //   this.friendsSuggested = friendsSuggested;
    // });
  }

  async ngOnInit() {
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
    //   where('friend_status', '==', FriendStatus.SUGGESTED)
    // );
    // const suggs = await getDocs(qFriendsSuggested);
    // suggs.forEach((snap) => {
    //   const user = snap.data() as AppUser;
    //   console.log('Friend sugg', user);
    //   this.friendsSuggested.push(user);
    // });
    // this.friends$ = collectionData(qFriends) as Observable<Friend[]>;
    // this.friendsSuggested$ = collectionData(qFriendsSuggested) as Observable<
    //   Friend[]
    // >;
  }

  async ionViewWillEnter() {
    this.allOtherUsers = await this.userSvc.getAllOtherUsers();
  }

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
          friend_uid: friend.uid,
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

  clearAutocomplete() {
    this.autocompleteItems = [];
    this.inputSearch = '';
  }

  updateSearchResults() {
    const pattern = this.inputSearch;
    if (pattern === '') {
      this.autocompleteItems = [];
      return;
    } else if (pattern && pattern.length > 2) {
      this.autocompleteItems = this.allOtherUsers.filter(
        (user) =>
          user.firstname!.toUpperCase().indexOf(pattern.toUpperCase()) >= 0 ||
          user.lastname!.toUpperCase().indexOf(pattern.toUpperCase()) >= 0
      );
      console.log('Results ', this.autocompleteItems);
    }
  }

  selectSearchResult(user: AppUser) {
    this.autocompleteItems = [];
    this.inputSearch = '';
    this.friendService.invite(user);
  }
}
