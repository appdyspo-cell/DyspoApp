import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DayNumberFormatPipe } from 'src/app/pipes/day-number-format.pipe';
import { DateChatFormatPipe } from 'src/app/pipes/date-chat-format.pipe';

@NgModule({
  declarations: [DayNumberFormatPipe, DateChatFormatPipe],
  exports: [DayNumberFormatPipe, DateChatFormatPipe],
  imports: [CommonModule],
})
export class SharedPipesModule {}
