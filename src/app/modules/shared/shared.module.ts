import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendsSelectorComponent } from 'src/app/components/friends/friends-selector.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { PictureComponent } from 'src/app/components/picture/picture.component';
import { AgendaEventMiniComponent } from 'src/app/components/agenda-event-mini/agenda-event-mini.component';
import { AgendaEventInfoComponent } from 'src/app/components/agenda-event-info/agenda-event-info.component';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ChatMenuComponent } from 'src/app/components/chat-menu/chat-menu.component';

import { DyspoViewerComponent } from 'src/app/components/dyspo-viewer/dyspo-viewer.component';

import { NgxPanZoomModule } from 'ngx-panzoom';
import { SwiperModule } from 'swiper/angular';
import { ReportComponent } from 'src/app/components/report/report.component';

import { AlphabetScrollComponent } from 'src/app/components/alphabet-scroll/alphabet-scroll.component';
import { HelperComponent } from 'src/app/components/helper/helper.component';

@NgModule({
  declarations: [
    FriendsSelectorComponent,
    PictureComponent,
    AgendaEventMiniComponent,
    AgendaEventInfoComponent,
    ChatMenuComponent,
    DyspoViewerComponent,
    ReportComponent,
    AlphabetScrollComponent,
    HelperComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    LazyLoadImageModule,
    NgxPanZoomModule,
    SwiperModule,
  ],
  exports: [
    FriendsSelectorComponent,
    PictureComponent,
    AgendaEventMiniComponent,
    ChatMenuComponent,
    AgendaEventInfoComponent,
    DyspoViewerComponent,
    ReportComponent,
    AlphabetScrollComponent,
    HelperComponent,
  ],
})
export class SharedModule {}
