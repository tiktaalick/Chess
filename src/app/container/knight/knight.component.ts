import { Component, OnInit, OnDestroy } from '@angular/core';
import { ItemTypes } from '../constants';

@Component({
  selector: 'app-knight',
  templateUrl: './knight.component.html',
  styleUrls: ['./knight.component.scss']
})
export class KnightComponent implements OnInit, OnDestroy {
    // knightSource = this.dnd.dragSource(ItemTypes.KNIGHT, {
    //     beginDrag: () => ({})
    // });
  
    constructor() { }

  ngOnInit() {
  }

  ngOnDestroy() {
    // this.knightSource.unsubscribe();
  }
}
