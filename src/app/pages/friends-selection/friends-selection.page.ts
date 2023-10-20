import { Component, OnInit } from '@angular/core';
import { Friend } from 'src/app/models/models';
import { FriendSelectionType } from '../agenda/create-event/create-event.page';

@Component({
  selector: 'app-friends-selection',
  templateUrl: './friends-selection.page.html',
  styleUrls: ['./friends-selection.page.scss'],
})
export class FriendsSelectionPage implements OnInit {
  friendSelectionType = FriendSelectionType;
  selectSegment = FriendSelectionType.FRIENDS;
  friends: Friend[] = [];
  inputSearch = '';

  constructor() {}

  ngOnInit() {}

  segmentChanged(ev: any) {
    // if(ev.detail.value ==='club'){
    //   try{
    //     if(this.map){
    //       this.map.remove();
    //     }
    //   }catch(err){
    //     console.log(err);
    //   };
    //   setTimeout(()=>{
    //     this.leafletMap();
    //   },100);
    // }
  }
  add(friend: Friend) {}
}
