import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DayNumberFormatPipe } from 'src/app/pipes/day-number-format.pipe';

@NgModule({
  declarations: [DayNumberFormatPipe],
  exports: [DayNumberFormatPipe],
  imports: [CommonModule],
})
export class SharedPipesModule {}
