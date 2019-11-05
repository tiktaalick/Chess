import { ChessPieceType } from './../constants';
import { Coordinates } from './../interfaces/coordinates';
import { Injectable, OnDestroy } from '@angular/core';
import { ChessPiece } from '../interfaces/chess.piece';
import { GameService } from './game.service';
import { TILE_SIZE } from '../constants';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class MoveService implements OnDestroy {
  public validMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public resetMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public isBlackMove$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private dragPosition: Coordinates = {x: 0, y: 0};
  private field(x: number, y: number): number {
    return x + 8 * y;
  }

  constructor(private game: GameService) { 
    this.isBlackMove$.subscribe(isBlackMove => {
      this.game.chessPieces.forEach(movingChessPiece => {
        movingChessPiece.myTurn = movingChessPiece.isBlack == isBlackMove;
      })
    })
  }

  ngOnDestroy(): void {
    this.isBlackMove$.unsubscribe();
  }

  private getNewPosition(event: any): Coordinates {
    const element = event.source.getRootElement();
    const boundingClientRect = element.getBoundingClientRect();
    const centerX = boundingClientRect.x + TILE_SIZE / 2;
    const centerY = boundingClientRect.y + TILE_SIZE / 2;

    return { x: Math.floor(centerX / TILE_SIZE)
           , y: Math.floor(centerY / TILE_SIZE) };
  }

  private hasMovedToAnotherField(dragPosition: Coordinates, newPosition: Coordinates): boolean {
     return (newPosition.x != dragPosition.x || newPosition.y != dragPosition.y);
  }

  private removeChessPiece(chessPieceToBeRemoved: ChessPiece) { 
    const index: number = this.game.chessPieces.indexOf(chessPieceToBeRemoved);

    if (index >= 0) {
      this.game.chessPieces.splice(index,1);
      this.game.chessPieces$.next(this.game.chessPieces);
    }
  }

  public moveChessPiece(movingChessPiece: ChessPiece) { 
    const to: number = this.field(movingChessPiece.to.x,movingChessPiece.to.y);
    const chessPieceToBeRemoved: ChessPiece = this.game.getChessPiece(to);    
    this.removeChessPiece(chessPieceToBeRemoved)
    
    const index: number = this.game.chessPieces.indexOf(movingChessPiece);    
    movingChessPiece.from = movingChessPiece.to;
    this.game.chessPieces[index] = movingChessPiece;
    this.game.chessPieces$.next(this.game.chessPieces);

    this.resetValidMove(this.dragPosition);
    this.isBlackMove$.next(!this.isBlackMove$.getValue());
  }

  private doCheckIfAllowed(movingChessPiece: ChessPiece, isMoving: boolean): boolean {
    const hasMovedToAnotherField: boolean = this.hasMovedToAnotherField(this.dragPosition, movingChessPiece.to);

    if (isMoving && hasMovedToAnotherField) {
      this.resetValidMove(this.dragPosition);
      this.dragPosition = { x: movingChessPiece.to.x, y: movingChessPiece.to.y };
      return true;
    } else if (!isMoving) {
      return true;
    } else return false;
  }

  public isMoveAllowed(event: any, field: number, isMoving: boolean): ChessPiece {
    const movingChessPiece: ChessPiece = this.game.getChessPiece(field);
    movingChessPiece.to = this.getNewPosition(event);
    
    const to: number = this.field(movingChessPiece.to.x,movingChessPiece.to.y);
    const chessPieceToBeRemoved: ChessPiece = this.game.getChessPiece(to);    

    const checkIfAllowed: boolean = this.doCheckIfAllowed(movingChessPiece, isMoving); 

    if (checkIfAllowed && chessPieceToBeRemoved && chessPieceToBeRemoved.isBlack == movingChessPiece.isBlack) {
      return null;
    } else if (checkIfAllowed && this.checkTheRules(movingChessPiece)) {
      return movingChessPiece;
    } else {
      return null;
    }  
  }
  
  public showValidMove(coordinates: Coordinates) {
    this.validMove$.next(this.field(coordinates.x,coordinates.y));
  }

  private resetValidMove(coordinates: Coordinates) {
    this.resetMove$.next(this.field(coordinates.x,coordinates.y));
  }

  private checkTheRules(movingChessPiece: ChessPiece): boolean {
    if (movingChessPiece.type == ChessPieceType.KNIGHT) {
      return this.checkTheRulesForKnight(movingChessPiece);
    }
  }  

  private checkTheRulesForKnight(movingChessPiece: ChessPiece): boolean {
    if (movingChessPiece.to.x >= 8 || movingChessPiece.to.y >= 8) {
      return false;
    }
    
    const horizontal = movingChessPiece.to.x - movingChessPiece.from.x;
    const vertical = movingChessPiece.to.y - movingChessPiece.from.y;

    return (Math.abs(horizontal) === 2 && Math.abs(vertical) === 1) ||
           (Math.abs(horizontal) === 1 && Math.abs(vertical) === 2);
  }  
}
