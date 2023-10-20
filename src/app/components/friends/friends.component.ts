import { Component, OnInit } from '@angular/core';
import { Friend } from 'src/app/models/models';
import { FriendSelectionType } from 'src/app/pages/agenda/create-event/create-event.page';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
})
export class FriendsComponent implements OnInit {
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
