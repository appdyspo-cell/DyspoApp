import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { GestureController } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-alphabet-scroll',
  templateUrl: './alphabet-scroll.component.html',
  styleUrls: ['./alphabet-scroll.component.scss'],
})
export class AlphabetScrollComponent implements OnInit, AfterViewInit {
  letters: string[] = [];
  @ViewChild('bar') sidebar!: ElementRef;
  lastOpen: string | null = null;
  @Output() letterSelected = new EventEmitter<string>();
  @Output() scrollingLetter = new EventEmitter<boolean>();
  constructor(private gestureCtrl: GestureController) {
    let str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < str.length; i++) {
      let nextChar = str.charAt(i);
      this.letters.push(nextChar);
    }
  }

  ngOnInit() {}

  ngAfterViewInit() {
    const moveGesture = this.gestureCtrl.create({
      el: this.sidebar.nativeElement,
      direction: 'y',
      threshold: 0,
      gestureName: 'move',
      onStart: (ev) => {
        this.scrollingLetter.emit(true);
      },
      onMove: (ev) => {
        // https://github.com/rossmartin/ionic2-alpha-scroll/blob/master/src/ion-alpha-scroll.ts
        const closestEle: any = document.elementFromPoint(
          ev.currentX,
          ev.currentY
        );
        if (closestEle && ['LI', 'A'].indexOf(closestEle.tagName) > -1) {
          const letter = closestEle.innerText;
          if (letter) {
            if (letter != this.lastOpen) {
              Haptics.impact({ style: ImpactStyle.Light });
            }
            this.goToLetter(letter);
          }
        }
      },
      onEnd: (ev) => {
        this.scrollingLetter.emit(false);
      },
    });

    // Don't forget to enable!
    moveGesture.enable(true);
  }

  goToLetter(letter: string) {
    if (this.lastOpen && this.lastOpen == letter) return;

    this.lastOpen = letter;
    this.letterSelected.emit(letter);
  }
}
