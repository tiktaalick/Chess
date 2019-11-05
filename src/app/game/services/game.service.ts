import { Coordinates } from '../interfaces/coordinates';
import { Injectable } from '@angular/core';
import { BehaviorSubject, from } from 'rxjs';
import { ChessPiece } from '../interfaces/chess.piece';
import { ChessPieceType, TILE_SIZE} from '../constants';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  chessPieces$: BehaviorSubject<ChessPiece[]> = this.initializeChessPieces$();
  validMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  resetMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  chessPieces: ChessPiece[];
  dragPosition: Coordinates = {x: 0, y: 0};
  
  coordinates(i: number): Coordinates {
    return {
      x: i % 8,
      y: Math.floor(i / 8)
    }
  }

  field(x: number, y: number): number {
    return x + 8 * y;
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
    
    chessPieces.push(this.createChessPiece(1, ChessPieceType.KNIGHT, true, {x: 1, y: 0}));
    chessPieces.push(this.createChessPiece(2, ChessPieceType.KNIGHT, true, {x: 6, y: 0}));
    chessPieces.push(this.createChessPiece(3, ChessPieceType.KNIGHT, false, {x: 1, y: 7}));
    chessPieces.push(this.createChessPiece(4, ChessPieceType.KNIGHT, false, {x: 6, y: 7}));

    return new BehaviorSubject<ChessPiece[]>(chessPieces);
  }

  createChessPiece(id: number, type: string, isBlack: boolean, coordinates): ChessPiece {
    const chessPiece: ChessPiece = {
      id: id,
      type: type,
      isBlack: isBlack,
      from: {x: coordinates.x, y: coordinates.y},
      to: {x: coordinates.x, y: coordinates.y}
    }; 

    return chessPiece;
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
    this.resetValidMove(this.dragPosition);
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
      this.resetValidMove(this.dragPosition);
      this.dragPosition = { x: chessPiece.to.x, y: chessPiece.to.y };
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
  
  showValidMove(coordinates: Coordinates) {
    this.validMove$.next(this.field(coordinates.x,coordinates.y));
  }

  resetValidMove(coordinates: Coordinates) {
    this.resetMove$.next(this.field(coordinates.x,coordinates.y));
  }
}
