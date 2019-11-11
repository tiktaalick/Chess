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

@Injectable({
  providedIn: 'root'
})
export class MoveService implements OnDestroy {
  public validMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public resetValidMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public checkMove$ = this.check.checkMove$;
  public resetCheckMove$ = this.check.resetCheckMove$;
  public isBlackMove$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private dragPosition: Coordinates = this.resetDragPosition();

  constructor(
    private game: GameService, 
    private castling: CastlingService, 
    private promote: PromotePawnService,
    private check: CheckService,
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

  public removeChessPiece(chessBoard: ChessBoard, chessPieceToBeRemoved: ChessPiece): ChessBoard { 
    console.log('removeChessPiece: ' + chessBoard.turnPhase);

    if(chessPieceToBeRemoved) {
      let localChessPiece = chessBoard.chessPieces.find(chessPiece => chessPiece.id === chessPieceToBeRemoved.id); 
      const index: number = chessBoard.chessPieces.indexOf(localChessPiece);

      if (index > -1) {
        chessBoard.chessPieces.splice(index,1);
        this.game.chessBoard$.next(chessBoard);
      }
    }
    return chessBoard;
  }

  private handleNoMoreMoves(chessBoard: ChessBoard, isBlack: boolean) {
    console.log('handleNoMoreMoves: ' + chessBoard.turnPhase);

    let isValidMoveFound: boolean = false;

    validmoves:
    for (let cp = 0; cp < chessBoard.chessPieces.length; cp++) {
      let chessPiece: ChessPiece = chessBoard.chessPieces[cp];
      if (!isValidMoveFound && chessPiece.isBlack === isBlack) {
        for (let f = 0; f < 64; f++) {
          let oldFromX = chessPiece.from.x;
          let oldFromY = chessPiece.from.y;
          let oldToX = chessPiece.to.x;
          let oldToY = chessPiece.to.y;
          chessPiece.to.x = this.game.coordinates(f).x;
          chessPiece.to.y = this.game.coordinates(f).y;
          isValidMoveFound = this.rules.isMoveAllowed(chessBoard,chessPiece);
          let checkPiece: ChessPiece;
          if (isValidMoveFound) {
            checkPiece = this.doIPutMyselfInCheck(chessBoard, chessPiece, true);
          }
          chessPiece.from.x = oldFromX;
          chessPiece.from.y = oldFromY;
          chessPiece.to.x = oldToX;
          chessPiece.to.y = oldToY;
          if (isValidMoveFound && checkPiece) {
            console.log('Valid move: '+chessPiece.type+' ('+chessPiece.from.x+','+chessPiece.from.y+') => ('+this.game.coordinates(f).x+','+this.game.coordinates(f).y+')');
            break validmoves;
          }
        }
      }
    }

    if (!isValidMoveFound) {
      console.log('isBlack='+isBlack+': no more moves');
    }
  }

  public moveChessPiece(movingChessPiece: ChessPiece) { 
    let chessBoard: ChessBoard = this.game.cloneChessBoard(this.game.chessBoard,TurnPhase.PLAYER_MOVE); 

    let chessPieceToBeRemoved: ChessPiece = this.rules.handleEnPassant(chessBoard, movingChessPiece);
    chessBoard = this.removeChessPiece(chessBoard, chessPieceToBeRemoved);
    
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
    chessPieceToBeRemoved = this.game.getChessPiece(this.game.chessBoard, to);    
    chessBoard = this.removeChessPiece(this.game.chessBoard, chessPieceToBeRemoved);
    
    chessBoard.chessPieces.find(chessPiece => chessPiece.id === movingChessPiece.id).from.x = movingChessPiece.to.x;
    chessBoard.chessPieces.find(chessPiece => chessPiece.id === movingChessPiece.id).from.y = movingChessPiece.to.y;

    this.game.chessBoard$.next(chessBoard);

    chessBoard.chessPieces.forEach(chessPiece => chessPiece.isUnderAttack = false);
    
    chessBoard = this.game.cloneChessBoard(chessBoard, TurnPhase.OTHER_CHECK);
    let checkPiece: ChessPiece = this.check.handleCheck(!movingChessPiece.isBlack, chessBoard, false);
    chessBoard.turnPhase = TurnPhase.PLAYER_SWITCH;


    //this.handleNoMoreMoves(this.game.chessPieces, !localMovingChessPiece.isBlack);

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

  private doIPutMyselfInCheck(chessBoard: ChessBoard, movingChessPiece: ChessPiece, checkForNoMoreMoves: boolean) {
    return this.check.doIPutMyselfInCheck(chessBoard, movingChessPiece, checkForNoMoreMoves);
  }

  public checkTheRules(chessBoard: ChessBoard, event: any, field: number, whileDragging: boolean): ChessPiece {
    const movingChessPiece: ChessPiece = this.game.getChessPiece(chessBoard, field);
    movingChessPiece.to.x = this.getNewPosition(event).x;
    movingChessPiece.to.y = this.getNewPosition(event).y;
    console.log('('+movingChessPiece.from.x+','+movingChessPiece.from.y+') => ('+movingChessPiece.to.x+','+movingChessPiece.to.y+')');
    
    const doPerformChecks: boolean = this.doPerformChecks(movingChessPiece, whileDragging); 

    if (doPerformChecks) {
      const isMoveAllowed: boolean = this.rules.isMoveAllowed(chessBoard, movingChessPiece);
      this.check.resetCheckMove();
      const checkPiece: ChessPiece = this.doIPutMyselfInCheck(chessBoard, movingChessPiece, whileDragging);
      if (isMoveAllowed && !checkPiece) {
        return movingChessPiece;
      }
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
