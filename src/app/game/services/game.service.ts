import { Coordinates } from '../interfaces/coordinates';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChessPiece } from '../interfaces/chess.piece';
import { ChessPieceType, TILE_SIZE } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  chessPieces$: BehaviorSubject<ChessPiece[]> = this.initializeChessPieces$();
  chessPieces: ChessPiece[];
  dragPosition = {x: 0, y: 0};

  coordinates(i): Coordinates {
    return {
      x: i % 8,
      y: Math.floor(i / 8)
    }
  }

  constructor() {
      this.chessPieces$.subscribe(chessPieces => {
        this.chessPieces = chessPieces;
      })
  }

  getChessPiece(field: number): ChessPiece {
    const fieldX = this.coordinates(field).x;
    const fieldY = this.coordinates(field).y;

    return this.chessPieces.find(
      cp => 
      cp.from.x == fieldX && 
      cp.from.y == fieldY);    
  }

  getNewPosition(event: any): Coordinates {
    const element = event.source.getRootElement();
    const boundingClientRect = element.getBoundingClientRect();
    const centerX = boundingClientRect.x + TILE_SIZE / 2;
    const centerY = boundingClientRect.y + TILE_SIZE / 2;

    return { x: Math.floor(centerX / TILE_SIZE)
           , y: Math.floor(centerY / TILE_SIZE) };
  }

  initializeChessPieces$(): BehaviorSubject<ChessPiece[]> {
    const chessPieces: ChessPiece[] = [];
    
    chessPieces.push({id: 1,type: ChessPieceType.KNIGHT, isBlack: true, from: {x: 1,y: 0}, to: null});
    chessPieces.push({id: 2,type: ChessPieceType.KNIGHT, isBlack: true, from: {x: 6,y: 0}, to: null});
    chessPieces.push({id: 3,type: ChessPieceType.KNIGHT, isBlack: false, from: {x: 1,y: 7}, to: null});
    chessPieces.push({id: 4,type: ChessPieceType.KNIGHT, isBlack: false, from: {x: 6,y: 7}, to: null});

    return new BehaviorSubject<ChessPiece[]>(chessPieces);
  }

  hasAChessPieceOfType(field: number, type: string): boolean {
    const chessPiece: ChessPiece = this.getChessPiece(field);

    return chessPiece && chessPiece.type == type ? true : false;
  }

  hasMovedToAnotherField(dragPosition: Coordinates, newPosition: Coordinates): boolean {
     return (newPosition.x != dragPosition.x || newPosition.y != dragPosition.y);
  }

  moveChessPiece(movingChessPiece: ChessPiece) { 
    const movingChessPieces = this.chessPieces;
    const index: number = movingChessPieces.indexOf(movingChessPiece);
    
    movingChessPiece.from = movingChessPiece.to;
    movingChessPieces[index] = movingChessPiece;

    this.chessPieces$.next(movingChessPieces);
  }

  canMoveKnight(movingChessPiece: ChessPiece) {
    if (movingChessPiece.to.x >= 8 || movingChessPiece.to.y >= 8) {
      return false;
    }
    
    const dx = movingChessPiece.to.x - movingChessPiece.from.x;
    const dy = movingChessPiece.to.y - movingChessPiece.from.y;

    return (Math.abs(dx) === 2 && Math.abs(dy) === 1) ||
           (Math.abs(dx) === 1 && Math.abs(dy) === 2);
  }  

  isMoveAllowed(event: any, field: number, isMoving: boolean): ChessPiece {
    const chessPiece: ChessPiece = this.getChessPiece(field);
    chessPiece.to = this.getNewPosition(event);
    const hasMovedToAnotherField: boolean = this.hasMovedToAnotherField(this.dragPosition, chessPiece.to);
    let checkIfAllowed: boolean = false;

    if (isMoving && hasMovedToAnotherField) {
      this.dragPosition = chessPiece.to;
      checkIfAllowed = true;
    } else if (!isMoving) {
      checkIfAllowed = true;
    }

    if (checkIfAllowed && this.canMoveKnight(chessPiece)) {
        return chessPiece;
    } else {
      return null;
    }  
  }
  
}
