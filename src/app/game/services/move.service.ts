import { TurnPhase } from './../constants';
import { ChessBoard, ChessPiece, Coordinates } from './../interfaces';
import { RulesService } from './rules.service';
import { CheckService } from './check.service';
import { PromotePawnService } from './promote-pawn.service';
import { TILE_SIZE } from '../constants';
import * as _ from 'lodash';
import { Injectable, OnDestroy } from '@angular/core';
import { GameService } from './game.service';
import { BehaviorSubject } from 'rxjs';
import { CastlingService } from './castling.service';
import { NoMoreMovesService } from './no-more-moves.service';

@Injectable({
  providedIn: 'root'
})
export class MoveService implements OnDestroy {
  public validMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public resetValidMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public checkMove$ = this.check.checkMove$;
  public resetCheckMove$ = this.check.resetCheckMove$;
  public playerHasLost$ = this.noMoreMoves.playerHasLost$;
  public isBlackMove$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private dragPosition: Coordinates = this.resetDragPosition();

  constructor(
    private game: GameService, 
    private castling: CastlingService, 
    private promote: PromotePawnService,
    private check: CheckService,
    private noMoreMoves: NoMoreMovesService,
    private rules: RulesService) { 
    this.isBlackMove$.subscribe(isBlackMove => {
      this.game.chessBoard.chessPieces.forEach(movingChessPiece => {
        movingChessPiece.myTurn = movingChessPiece.isBlack === isBlackMove;
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
    if(dragPosition.x == -1 && dragPosition.y == -1) {
      this.dragPosition.x = newPosition.x;
      this.dragPosition.y = newPosition.y;
      dragPosition = this.dragPosition;
    }

    return !(newPosition.x === dragPosition.x && newPosition.y === dragPosition.y);
  }

  public moveChessPiece(chessBoard: ChessBoard, movingChessPiece: ChessPiece) { 
    chessBoard.turnPhase =TurnPhase.PLAYER_MOVE; 

    chessBoard = this.rules.handleEnPassant(chessBoard, movingChessPiece);
    
    // Handle castling
    const kingAndRook: ChessPiece[] = this.castling.handleCastling(chessBoard, movingChessPiece);
    movingChessPiece = kingAndRook[0];
    let index = chessBoard.chessPieces.indexOf(kingAndRook[1]);
    if (index > -1) {
      chessBoard.chessPieces[index] = kingAndRook[1];
    }
    index = chessBoard.chessPieces.indexOf(kingAndRook[2]);
    if (index > -1) {
      chessBoard.chessPieces[index] = kingAndRook[2];
      chessBoard.chessPieces[index].from.x = chessBoard.chessPieces[index].to.x;
      chessBoard.chessPieces[index].from.y = chessBoard.chessPieces[index].to.y;
    }
    
    movingChessPiece = this.promote.promotePawn(movingChessPiece);

    const to: number = this.game.field(movingChessPiece.to.x,movingChessPiece.to.y);
    
    chessBoard.chessPieces.find(chessPiece => chessPiece.id === movingChessPiece.id).from.x = movingChessPiece.to.x;
    chessBoard.chessPieces.find(chessPiece => chessPiece.id === movingChessPiece.id).from.y = movingChessPiece.to.y;

    this.game.chessBoard$.next(chessBoard);

    chessBoard.chessPieces.forEach(chessPiece => chessPiece.isUnderAttack = false);
    
    this.noMoreMoves.handleNoMoreMoves(chessBoard, !movingChessPiece.isBlack);

    chessBoard = this.game.cloneChessBoard(chessBoard, TurnPhase.OTHER_CHECK);
    let checkPiece: ChessPiece = this.check.handleCheck(!movingChessPiece.isBlack, chessBoard);
    chessBoard.turnPhase = TurnPhase.PLAYER_SWITCH;

    if (!checkPiece) {
      this.check.resetCheckMove();
    }
    this.resetValidMove(this.dragPosition);
    this.dragPosition = this.resetDragPosition();
    this.isBlackMove$.next(!this.isBlackMove$.getValue());
  }

  private doPerformChecks(movingChessPiece: ChessPiece, whileDragging: boolean): boolean {
    const hasMovedToAnotherField: boolean = this.hasMovedToAnotherField(this.dragPosition, movingChessPiece.to);

    if (whileDragging && hasMovedToAnotherField) {
      this.resetValidMove(this.dragPosition);
      this.dragPosition = { x: movingChessPiece.to.x, y: movingChessPiece.to.y };
      return true;
    } 
    
    if (!whileDragging) {
      return true;
    } else {
      this.dragPosition = { x: movingChessPiece.to.x, y: movingChessPiece.to.y };
    }
    
    return false;
  }

  public checkTheRulesForActivePlayer(chessBoard: ChessBoard, event: any, field: number, whileDragging: boolean, resetDragging: boolean): ChessPiece {
    const movingChessPiece: ChessPiece = this.game.getChessPiece(chessBoard, field);
    if (resetDragging) {
      movingChessPiece.to.x = movingChessPiece.from.x;
      movingChessPiece.to.y = movingChessPiece.from.y;
    } else {
      movingChessPiece.to.x = this.getNewPosition(event).x;
      movingChessPiece.to.y = this.getNewPosition(event).y;
    }

    const doPerformChecks: boolean = this.doPerformChecks(movingChessPiece, whileDragging); 

    if (doPerformChecks) {
      return this.check.checkTheRules(chessBoard, movingChessPiece);
    }
    
    return null;
  }
  
  public showValidMove(coordinates: Coordinates) {
    this.validMove$.next(this.game.field(coordinates.x,coordinates.y));
  }

  private resetValidMove(coordinates: Coordinates) {
    this.resetValidMove$.next(this.game.field(coordinates.x,coordinates.y));
  }

  private resetDragPosition(): Coordinates {
    return {x: -1, y: -1};
  }
}
