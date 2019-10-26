import { GameService } from './../services/game.service';
import { Component, OnInit } from '@angular/core';
import { Coordinates } from '../interfaces/coordinates';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  knightPosition$ = this.game.knightPosition$;
  sixtyFour = new Array(64)
    .fill(0)
    .map((_,i) => i);
  xy(i): Coordinates {
    return {
      x: i % 8,
      y: Math.floor(i / 8)
    }
  }
  
constructor(private game: GameService) { }  

  ngOnInit() {
  }

  isBlack({ x, y }: Coordinates) {
      return (x + y) % 2 === 1;
  }

handleSquareClick(pos: Coordinates) {
    if (this.game.canMoveKnight(pos)) {
        this.game.moveKnight(pos);
    }}
}
