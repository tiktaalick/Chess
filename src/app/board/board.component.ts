import { Component, OnInit } from '@angular/core';
import { Coordinates } from '../../interfaces/coordinates';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  sixtyFour = new Array(64)
    .fill(0)
    .map((_,i) => i);
  xy(i): Coordinates {
    return {
      x: i % 8,
      y: Math.floor(i / 8)
    }
  }
  
  constructor() { }

  ngOnInit() {
  }

  isBlack({ x, y }: Coordinates) {
      return (x + y) % 2 === 1;
  }

}
