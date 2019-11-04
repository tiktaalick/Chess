import { ChessPiece } from './../interfaces/chess.piece';
import { ChessPieceType, TILE_SIZE } from './../constants';
import { GameService } from '../services/game.service';
import { Component, OnInit } from '@angular/core';
import { Coordinates } from '../interfaces/coordinates';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  chessPieces$ = this.game.chessPieces$;
  fields: number[] = new Array(64).fill(0).map((_,i) => i);
  
  constructor(private game: GameService) { }  

  ngOnInit() {
  }

  isDarkerTile(field: number): boolean {
    return (this.game.coordinates(field).x + this.game.coordinates(field).y) % 2 === 1;
  }

  hasAKnight(field: number): boolean {
    return this.game.hasAChessPieceOfType(field, ChessPieceType.KNIGHT);
  }

  isChessPieceBlack(field: number) {
    const chessPiece: ChessPiece = this.game.getChessPiece(field);

    return chessPiece && chessPiece.isBlack ? true : false;
  }

  onDragMoved(event: any, field: number) {
    const movingChessPiece: ChessPiece = this.game.isMoveAllowed(event, field, true);

    if(movingChessPiece) {
      console.log('Moving knight is allowed');  
    }  
  }

  onDragEnded(event: any, field: number) {
    const movingChessPiece: ChessPiece = this.game.isMoveAllowed(event, field, false);

    if(movingChessPiece) {
      console.log('...moving knight...');  
      this.game.moveChessPiece(movingChessPiece);
    } else {
      console.log('...invalid move!');
      event.source.reset();
    }  
  }
}
