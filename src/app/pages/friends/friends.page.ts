import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import {
  AlertController,
  AnimationController,
  IonItemGroup,
  NavController,
} from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import {
  AppContact,
  AppUser,
  Friend,
  FriendGroup,
  FriendStatus,
} from 'src/app/models/models';
import { FriendsService } from 'src/app/services/friends.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.page.html',
  styleUrls: ['./friends.page.scss'],
})
export class FriendsPage implements OnInit {
  @ViewChildren(IonItemGroup, { read: ElementRef }) itemGroups!: QueryList<any>;
  scroll = false;
  showProfile(_t174: Friend, $event: MouseEvent) {
    throw new Error('Method not implemented.');
  }

  scrollToLetter(letter: string) {
    for (let i = 0; i < this.friendsAlpha.length; i++) {
      const group = this.friendsAlpha[i];
      if (group.letter == letter) {
        const group = this.itemGroups.filter((element, index) => index === i);
        if (group) {
          const el: any = group[0];
          el.nativeElement.scrollIntoView();
        }
        return;
      }
    }
  }

  letterScrollActive(active: boolean) {
    this.scroll = active;
  }
  defaultImage = 'assets/logo.svg';
  selectSegment = 'friends';
  rate = 3;
  uid: any;

  friends$: Observable<Friend[]>;
  friendGroups$: Observable<FriendGroup[]>;

  friends: Friend[] = [];
  friendsAlpha: { letter: string; contacts: Friend[] }[] = [];
  friendGroups: FriendGroup[] = [];
  friendsSuggested: Friend[] = [];

  inputSearch = '';
  autocompleteItems: AppUser[] = [];
  allOtherUsers: AppUser[] = [];
  friendsSubscrition: Subscription;
  friendGroupsSubscrition: Subscription;

  constructor(
    public utils: UtilsService,
    public alertCtrl: AlertController,
    public route: Router,
    private userSvc: UserService,
    public friendService: FriendsService,
    public animationCtrl: AnimationController,
    private navCtrl: NavController
  ) {
    this.friends$ = this.friendService.friends$;
    this.friendGroups$ = this.friendService.friendGroups$;

    this.friendsSubscrition = this.friends$.subscribe((friends) => {
      console.log('Friends  ', friends);
      this.friends = friends.filter(
        (elt) => elt.friend_status === FriendStatus.FRIEND
      );
      this.friendsAlpha = this.groupContactsByAlphabet(this.friends);
      console.log(this.friendsAlpha);
      this.friendsSuggested = friends.filter(
        (elt) => elt.friend_status === FriendStatus.SUGGESTED
      );
    });

    this.friendGroupsSubscrition = this.friendGroups$.subscribe(
      (friendGroups) => {
        this.friendGroups = friendGroups;
        console.log('Friend Groups  ', friendGroups);
      }
    );
  }

  async ngOnInit() {}

  ngOnDestroy() {
    this.friendsSubscrition.unsubscribe();
  }

  async ionViewWillEnter() {
    this.allOtherUsers = await this.userSvc.getAllOtherUsers();
  }

  promptDeleteFriend(friend: Friend, i: number) {
    this.alertCtrl
      .create({
        header: 'Suppression',
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

  promptDeleteFriendGroup(friendGroup: FriendGroup, i: number) {
    this.alertCtrl
      .create({
        header: 'Suppression',
        message: 'Etes-vous sur de vouloir supprimer ce groupe ?',

        buttons: [
          {
            text: 'Annuler',
            handler: (data: any) => {
              console.log('Canceled', data);
              const slidingItem = document.getElementById(
                'slidingItemGroup' + i
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
              this.deleteFriendGroup(friendGroup, slidingItem);
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

  async deleteFriendGroup(friendGroup: FriendGroup, listElement: any) {
    const animationDeleteItem = this.animationCtrl
      .create()
      .addElement(listElement)
      .duration(600)
      .iterations(1)
      .fromTo('height', '100px', 0)
      .fromTo('transform', 'translateX(0px)', 'translateX(-1050px)')
      .fromTo('opacity', 1, 0);

    animationDeleteItem.play();
    this.friendService.deleteFriendGroup(friendGroup, listElement);
    this.utils.showToast('Groupe supprimé');
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

  showAgenda(friend: AppUser, event: any) {
    event.stopPropagation();
    //this.utils.showModalPage(AmiFicheComponent, {friendListDoc: friend, userData: friend.userData});
    const navigationExtras: NavigationExtras = {
      state: {
        friend,
      },
    };

    this.navCtrl.navigateForward('agenda/friend', navigationExtras);
  }

  showFriendGroup(friendGroup: FriendGroup, event: any) {
    event.stopPropagation();
    const navigationExtras: NavigationExtras = {
      state: {
        friendGroup,
      },
    };
    this.navCtrl.navigateForward('create-group/edit', navigationExtras);
  }

  async openFriendGroupForm() {
    this.navCtrl.navigateForward('create-group/new');
  }

  async confirmFriendInvitation(friend: AppUser, index: number, event: any) {
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
      this.utils.showToastSuccess('Ami ajouté');
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
      this.autocompleteItems.forEach((user) => {
        user.is_my_friend = this.friendService.isMyFriend(user.uid);
        console.log(user);
      });
      console.log('Results ', this.autocompleteItems);
    }
  }

  inviteFriend(user: AppUser) {
    this.autocompleteItems = [];
    this.inputSearch = '';
    this.friendService.invite(user);
  }

  _groupContactsByAlphabet(contacts: Friend[]) {
    return contacts.reduce((groups: any, contact) => {
      const letter = contact.userData!.lastname!.charAt(0).toUpperCase();
      groups[letter] = groups[letter] || [];
      groups[letter].push(contact);
      return groups;
    }, {});
  }

  groupContactsByAlphabet(contacts: Friend[]) {
    const groups: any = {};
    contacts.forEach((contact) => {
      const letter = contact.userData!.lastname!.charAt(0).toUpperCase();
      groups[letter] = groups[letter] || [];
      groups[letter].push(contact);
    });
    return Object.keys(groups).map((letter) => ({
      letter,
      contacts: groups[letter],
    }));
  }
}
