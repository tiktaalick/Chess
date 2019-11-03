import { Coordinates } from '../interfaces/coordinates';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChessPiece } from '../interfaces/chess.piece';
import { ChessPieceType } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  chessPieces$: BehaviorSubject<ChessPiece[]> = this.initializeChessPieces$();
  chessPieces: ChessPiece[];

  constructor() {
      this.chessPieces$.subscribe(chessPieces => {
        console.log('Chess pieces have moved');
        
        this.chessPieces = chessPieces;
      })
  }

  initializeChessPieces$(): BehaviorSubject<ChessPiece[]> {
    console.log('Initializing chess pieces');
    var chessPieces: ChessPiece[] = [];
    chessPieces.push({id: 1,type: ChessPieceType.KNIGHT, isBlack: true,coordinates: {x: 1,y: 0}});
    chessPieces.push({id: 2,type: ChessPieceType.KNIGHT, isBlack: true,coordinates: {x: 6,y: 0}});
    chessPieces.push({id: 3,type: ChessPieceType.KNIGHT, isBlack: false,coordinates: {x: 1,y: 7}});
    chessPieces.push({id: 4,type: ChessPieceType.KNIGHT, isBlack: false,coordinates: {x: 6,y: 7}});

    return new BehaviorSubject<ChessPiece[]>(chessPieces);
  }

  moveChessPiece(movingChessPiece: ChessPiece, to: Coordinates) { 
    console.log('Moving chess pieces');
    let movingChessPieces = this.chessPieces;
    const index: number = movingChessPieces.indexOf(movingChessPiece);
    
    movingChessPiece.coordinates = to;
    movingChessPieces[index] = movingChessPiece;
    this.chessPieces$.next(movingChessPieces);
  }

  canMoveKnight(movingChessPiece: ChessPiece, from: Coordinates, to: Coordinates) {
    console.log('Is this knight performing a correct move?');
    let movingChessPieces = this.chessPieces;
    const index: number = movingChessPieces.indexOf(movingChessPiece);
    
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    console.log('Trying to move from ('+from.x+','+from.y+') to ('+to.x+','+to.y+')...')

    return (Math.abs(dx) === 2 && Math.abs(dy) === 1) ||
            (Math.abs(dx) === 1 && Math.abs(dy) === 2);
  }  

}
