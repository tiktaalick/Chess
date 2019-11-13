import { TurnPhase } from '../constants';
import { ChessBoard, ChessPiece, Coordinates } from '../interfaces';
import { RulesService } from './rules.service';
import { CheckService } from './check.service';
import { PromotePawnService } from './promote-pawn.service';
import * as _ from 'lodash';
import { Injectable, OnDestroy } from '@angular/core';
import { ChessBoardService } from './chess-board.service';
import { BehaviorSubject } from 'rxjs';
import { CastlingService } from './castling.service';
import { NoMoreMovesService } from './no-more-moves.service';

@Injectable({
  providedIn: 'root'
})
export class GameService implements OnDestroy {
  public validMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public resetValidMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public checkMove$ = this.check.checkMove$;
  public resetCheckMove$ = this.check.resetCheckMove$;
  public playerHasLost$ = this.noMoreMoves.playerHasLost$;
  public isBlackMove$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private dragPosition: Coordinates = this.resetDragPosition();

  constructor(
    private chessBoard: ChessBoardService, 
    private castling: CastlingService, 
    private promote: PromotePawnService,
    private check: CheckService,
    private noMoreMoves: NoMoreMovesService,
    private rules: RulesService) { 
    this.isBlackMove$.subscribe(isBlackMove => {
      this.chessBoard.chessBoard.chessPieces.forEach(movingChessPiece => {
        movingChessPiece.myTurn = movingChessPiece.isBlack === isBlackMove;
      })
    })
  }

  ngOnDestroy(): void {
    this.isBlackMove$.unsubscribe();
  }

  public moveChessPiece(chessBoard: ChessBoard, movingChessPiece: ChessPiece) { 
    chessBoard.turnPhase =TurnPhase.PLAYER_MOVE; 

    chessBoard = this.rules.handleEnPassant(chessBoard, movingChessPiece);
    chessBoard = this.castling.handleCastling(chessBoard, movingChessPiece);
    chessBoard = this.promote.promotePawn(chessBoard, movingChessPiece);

    chessBoard.chessPieces.find(chessPiece => chessPiece.id === movingChessPiece.id).from.x = movingChessPiece.to.x;
    chessBoard.chessPieces.find(chessPiece => chessPiece.id === movingChessPiece.id).from.y = movingChessPiece.to.y;

    this.chessBoard.chessBoard$.next(chessBoard);
    this.noMoreMoves.handleNoMoreMoves(chessBoard, !movingChessPiece.isBlack);

    chessBoard.chessPieces.forEach(chessPiece => chessPiece.isUnderAttack = false);

    if (!this.check.handleCheck(chessBoard, TurnPhase.OTHER_CHECK, !movingChessPiece.isBlack)) {
      this.check.resetCheckMove();
    }

    chessBoard.turnPhase = TurnPhase.PLAYER_SWITCH;

    this.resetValidMove(this.dragPosition);
    this.dragPosition = this.resetDragPosition();
    this.isBlackMove$.next(!this.isBlackMove$.getValue());
  }

  public showValidMove(coordinates: Coordinates) {
    this.validMove$.next(this.chessBoard.field(coordinates.x,coordinates.y));
  }

  private resetValidMove(coordinates: Coordinates) {
    this.resetValidMove$.next(this.chessBoard.field(coordinates.x,coordinates.y));
  }

  private hasMovedToAnotherField(dragPosition: Coordinates, newPosition: Coordinates): boolean {
    if(dragPosition.x == -1 && dragPosition.y == -1) {
      this.dragPosition.x = newPosition.x;
      this.dragPosition.y = newPosition.y;
      dragPosition = this.dragPosition;
    }

    return !(newPosition.x === dragPosition.x && newPosition.y === dragPosition.y);
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
    const movingChessPiece: ChessPiece = this.chessBoard.getChessPiece(chessBoard, field);
    if (resetDragging) {
      movingChessPiece.to.x = movingChessPiece.from.x;
      movingChessPiece.to.y = movingChessPiece.from.y;
    } else {
      movingChessPiece.to.x = this.chessBoard.getNewPosition(event).x;
      movingChessPiece.to.y = this.chessBoard.getNewPosition(event).y;
    }

    const doPerformChecks: boolean = this.doPerformChecks(movingChessPiece, whileDragging); 

    if (doPerformChecks) {
      return this.check.checkTheRules(chessBoard, movingChessPiece);
    }
    
    return null;
  }
  
  private resetDragPosition(): Coordinates {
    return {x: -1, y: -1};
  }
}
