import { BoardComponent } from './../board/board.component';
import { CastlingStatus, TILE_SIZE, ChessPieceType, EnPassantStatus } from '../constants';
import { ChessPiece, Coordinates } from '../interfaces';
import { Injectable, OnDestroy } from '@angular/core';
import { GameService } from './game.service';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class MoveService implements OnDestroy {
  public validMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public resetValidMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public checkMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public isBlackMove$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private dragPosition: Coordinates = {x: 0, y: 0};
  private field(x: number, y: number): number {
    return x + 8 * y;
  }

  constructor(private game: GameService) { 
    this.isBlackMove$.subscribe(isBlackMove => {
      this.game.chessPieces.forEach(movingChessPiece => {
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
     return (newPosition.x != dragPosition.x || newPosition.y != dragPosition.y);
  }

  private removeChessPiece(chessPieceToBeRemoved: ChessPiece) { 
    const index: number = this.game.chessPieces.indexOf(chessPieceToBeRemoved);

    if (index > -1) {
      this.game.chessPieces.splice(index,1);
      this.game.chessPieces$.next(this.game.chessPieces);
    }
  }

  private handleEnPassant(movingChessPiece: ChessPiece): ChessPiece {
    let chessPieceToBeRemovedEnPassent: ChessPiece = this.game.chessPieces.find(chessPiece => chessPiece.enPassantStatus === EnPassantStatus.ABOUT_TO_BE_KICKED_OFF);
    this.removeChessPiece(chessPieceToBeRemovedEnPassent);
    
    let resetEnPassent: ChessPiece = this.game.chessPieces.find(chessPiece => chessPiece.enPassantStatus === EnPassantStatus.ALLOWED);
    if (resetEnPassent) {
      resetEnPassent.enPassantStatus = EnPassantStatus.NOT_ALLOWED;
    }

    if (movingChessPiece.type === ChessPieceType.PAWN &&
        Math.abs(movingChessPiece.to.y - movingChessPiece.from.y) === 2) {
          movingChessPiece.enPassantStatus = EnPassantStatus.ALLOWED;
    } 
    
    return movingChessPiece;
  }

  private castleRook(king: ChessPiece, castleLeft: boolean) {
    let rookToCastle: ChessPiece = this.game.chessPieces.find(
      chessPiece => chessPiece.type === ChessPieceType.ROOK && 
                    chessPiece.isBlack === king.isBlack &&
                    (castleLeft 
                      ? chessPiece.castlingLeftStatus === CastlingStatus.ALLOWED 
                      : chessPiece.castlingRightStatus === CastlingStatus.ALLOWED));      
    rookToCastle.to.x = castleLeft ? rookToCastle.from.x + 3 : rookToCastle.from.x - 2;
    this.moveChessPiece(rookToCastle);
    this.isBlackMove$.next(!this.isBlackMove$.getValue());
  }

  private dontCastleKing(rookToCastle: ChessPiece, castleLeft: boolean) {
    const index: number = this.game.chessPieces.findIndex(
      chessPiece => chessPiece.type === ChessPieceType.KING && 
                    chessPiece.isBlack === rookToCastle.isBlack); 
    this.game.chessPieces[index].castlingLeftStatus = castleLeft 
                    ? CastlingStatus.NOT_ALLOWED 
                    : this.game.chessPieces[index].castlingLeftStatus;
    this.game.chessPieces[index].castlingRightStatus = castleLeft 
                    ? this.game.chessPieces[index].castlingRightStatus 
                    : CastlingStatus.NOT_ALLOWED;
  }

  private handleCastling(movingChessPiece: ChessPiece): ChessPiece {
    if (movingChessPiece.type === ChessPieceType.KING && movingChessPiece.castlingLeftStatus === CastlingStatus.ABOUT_TO_CASTLE) {
      this.castleRook(movingChessPiece, true);
    } 
    
    if (movingChessPiece.type === ChessPieceType.KING && movingChessPiece.castlingRightStatus === CastlingStatus.ABOUT_TO_CASTLE) {
      this.castleRook(movingChessPiece, false);
    }

    if (movingChessPiece.type === ChessPieceType.ROOK && movingChessPiece.castlingLeftStatus === CastlingStatus.ALLOWED) {
      this.dontCastleKing(movingChessPiece, true);
    }

    if (movingChessPiece.type === ChessPieceType.ROOK && movingChessPiece.castlingRightStatus === CastlingStatus.ALLOWED) {
      this.dontCastleKing(movingChessPiece, false);
    }

    if([ChessPieceType.KING, ChessPieceType.ROOK].indexOf(movingChessPiece.type) > -1) {
      movingChessPiece.castlingLeftStatus = CastlingStatus.NOT_ALLOWED;
      movingChessPiece.castlingRightStatus = CastlingStatus.NOT_ALLOWED;
    }     
    
    return movingChessPiece;
  }

  private promotePawn(movingChessPiece: ChessPiece): ChessPiece {
    if (movingChessPiece.type === ChessPieceType.PAWN && [0,7].indexOf(movingChessPiece.to.y) > -1) {
      movingChessPiece.type = ChessPieceType.QUEEN;
    }
    
    return movingChessPiece;
  }

  private handleCheck(isBlack: boolean): ChessPiece {
    let king: ChessPiece = this.game.chessPieces.find(
      chessPiece => 
        chessPiece.type === ChessPieceType.KING &&
        chessPiece.isBlack === isBlack
    );

    let isCheck: boolean = false;
    let checkPiece: ChessPiece;

    this.game.chessPieces.forEach((chessPiece: ChessPiece) => {
        if (!isCheck && chessPiece.isBlack !== isBlack) {
          let oldToX = chessPiece.to.x;
          let oldToY = chessPiece.to.y;
          chessPiece.to.x = king.from.x;
          chessPiece.to.y = king.from.y;
          isCheck = this.isMoveAllowed(chessPiece);
          chessPiece.to.x = oldToX;
          chessPiece.to.y = oldToY;
          if (isCheck) {
            checkPiece = chessPiece;
          } 
        }
      });

    if(checkPiece) {
      this.showCheckMove({x: king.from.x, y: king.from.y});
      this.showCheckMove({x: checkPiece.from.x, y: checkPiece.from.y});
      king.isCheckMove = true;
    }

    return checkPiece;
  }
  
  public moveChessPiece(movingChessPiece: ChessPiece) { 
    movingChessPiece = this.handleEnPassant(movingChessPiece);
    movingChessPiece = this.handleCastling(movingChessPiece);
    movingChessPiece = this.promotePawn(movingChessPiece);

    const to: number = this.field(movingChessPiece.to.x,movingChessPiece.to.y);
    const chessPieceToBeRemoved: ChessPiece = this.game.getChessPiece(to);    
    this.removeChessPiece(chessPieceToBeRemoved)
    
    const index: number = this.game.chessPieces.indexOf(movingChessPiece);    
    movingChessPiece.from.x = movingChessPiece.to.x;
    movingChessPiece.from.y = movingChessPiece.to.y;
    this.game.chessPieces.forEach(chessPiece => chessPiece.isCheckMove = false);
    this.game.chessPieces[index] = movingChessPiece;

    this.game.chessPieces$.next(this.game.chessPieces);

    this.resetValidMove(this.dragPosition);
    this.isBlackMove$.next(!this.isBlackMove$.getValue());

    this.handleCheck(!movingChessPiece.isBlack);
  }

  private doCheckIfAllowed(movingChessPiece: ChessPiece, isMoving: boolean): boolean {
    const hasMovedToAnotherField: boolean = this.hasMovedToAnotherField(this.dragPosition, movingChessPiece.to);

    if (isMoving && hasMovedToAnotherField) {
      this.resetValidMove(this.dragPosition);
      this.dragPosition = { x: movingChessPiece.to.x, y: movingChessPiece.to.y };
      return true;
    } 
    
    if (!isMoving) {
      return true;
    } 
    
    return false;
  }

  private doIPutMyselfInCheck(movingChessPiece: ChessPiece) {
    const index: number = this.game.chessPieces.indexOf(movingChessPiece);    

    const oldFromX = movingChessPiece.from.x;
    const oldFromY = movingChessPiece.from.y;

    movingChessPiece.from.x = movingChessPiece.to.x;
    movingChessPiece.from.y = movingChessPiece.to.y;

    this.game.chessPieces[index] = movingChessPiece;

    const checkPiece: ChessPiece = this.handleCheck(movingChessPiece.isBlack);

    movingChessPiece.from.x = oldFromX;
    movingChessPiece.from.y = oldFromY;
    this.game.chessPieces[index] = movingChessPiece;

    return checkPiece &&
           checkPiece.from.x === movingChessPiece.to.x && 
           checkPiece.from.y === movingChessPiece.to.y ? null : checkPiece;
  }
  
  public checkTheRules(event: any, field: number, isMoving: boolean): ChessPiece {
    const movingChessPiece: ChessPiece = this.game.getChessPiece(field);
    movingChessPiece.to.x = this.getNewPosition(event).x;
    movingChessPiece.to.y = this.getNewPosition(event).y;
    
    const to: number = this.field(movingChessPiece.to.x,movingChessPiece.to.y);
    const chessPieceToBeRemoved: ChessPiece = this.game.getChessPiece(to);

    const checkIfAllowed: boolean = this.doCheckIfAllowed(movingChessPiece, isMoving); 

    if (checkIfAllowed && this.doIPutMyselfInCheck(movingChessPiece)) {
      return null;
    }

    if (checkIfAllowed && chessPieceToBeRemoved && chessPieceToBeRemoved.isBlack === movingChessPiece.isBlack) {
      return null;
    } 
    
    if (checkIfAllowed && this.isMoveAllowed(movingChessPiece)) {
      return movingChessPiece;
    } 
    
    return null;
  }
  
  public showValidMove(coordinates: Coordinates) {
    this.validMove$.next(this.field(coordinates.x,coordinates.y));
  }

  private resetValidMove(coordinates: Coordinates) {
    this.resetValidMove$.next(this.field(coordinates.x,coordinates.y));
  }

  public showCheckMove(coordinates: Coordinates) {
    this.checkMove$.next(this.field(coordinates.x,coordinates.y));
  }

  private isMoveAllowed(movingChessPiece: ChessPiece): boolean {
    const horizontal = movingChessPiece.to.x - movingChessPiece.from.x; 
    const vertical = movingChessPiece.to.y - movingChessPiece.from.y;

    if (movingChessPiece.to.x >= 8 || movingChessPiece.to.y >= 8) {
      return false;
    } 
    
    if (movingChessPiece.type === ChessPieceType.ROOK) {
      return this.isRookMoveAllowed(movingChessPiece, horizontal, vertical);
    } 

    if (movingChessPiece.type === ChessPieceType.KNIGHT) {
      return this.isKnightMoveAllowed(horizontal, vertical);
    }

    if (movingChessPiece.type === ChessPieceType.BISHOP) {
      return this.isBishopMoveAllowed(movingChessPiece, horizontal, vertical);
    }

    if (movingChessPiece.type === ChessPieceType.QUEEN) {
      return this.isQueenMoveAllowed(movingChessPiece, horizontal, vertical);
    } 
    
    if (movingChessPiece.type === ChessPieceType.KING) {
      return this.isKingMoveAllowed(movingChessPiece, horizontal, vertical);
    } 

    if (movingChessPiece.type === ChessPieceType.PAWN) {
      return this.isPawnMoveAllowed(movingChessPiece, horizontal, vertical);
    } 
  }  

  private mustIJump(movingChessPiece: ChessPiece, horizontal: number, vertical: number): boolean {   
    const stepX = Math.sign(horizontal);
    const stepY = Math.sign(vertical);
    const startX = movingChessPiece.from.x + stepX;
    const startY = movingChessPiece.from.y + stepY;

    for (let dragPosition: Coordinates = {x: startX, y: startY}; 
        dragPosition.x !== movingChessPiece.to.x || 
        dragPosition.y !== movingChessPiece.to.y; 
        dragPosition.x += stepX, dragPosition.y += stepY) {
      if (this.game.getChessPiece(this.field(dragPosition.x,dragPosition.y))) {
        return true;
      }
      if (dragPosition.x < 0 || dragPosition.x > 7 || dragPosition.y < 0 || dragPosition.y > 7) {
        return true
      }
    }

    return false;
  }

  private isRookMoveAllowed(rook: ChessPiece, horizontal: number, vertical: number): boolean {   
    const isBesidesJumpingValid: boolean = (horizontal !== 0 && vertical === 0) ||
                                           (horizontal === 0 && vertical !== 0);

    const mustIJump: boolean = this.mustIJump(rook, horizontal, vertical);
    
    return isBesidesJumpingValid && !mustIJump ? true : false;
  }  

  private isKnightMoveAllowed(horizontal: number, vertical: number): boolean {    
    return (Math.abs(horizontal) === 2 && Math.abs(vertical) === 1) ||
           (Math.abs(horizontal) === 1 && Math.abs(vertical) === 2);
  }  

  private isBishopMoveAllowed(bishop: ChessPiece, horizontal: number, vertical: number): boolean {   
    const isBesidesJumpingValid: boolean = (Math.abs(horizontal) === Math.abs(vertical));
    const mustIJump: boolean = this.mustIJump(bishop, horizontal, vertical);
    
    return isBesidesJumpingValid && !mustIJump ? true : false;
  }  

  private isQueenMoveAllowed(queen: ChessPiece, horizontal: number, vertical: number): boolean {   
    const isBesidesJumpingValid: boolean = (horizontal !== 0 && vertical === 0) ||
                                         (horizontal === 0 && vertical !== 0) ||
                                         (Math.abs(horizontal) === Math.abs(vertical));

    const mustIJump: boolean = this.mustIJump(queen, horizontal, vertical);
    
    return isBesidesJumpingValid && !mustIJump ? true : false;
  }  

  private isKingMoveAllowed(king: ChessPiece, horizontal: number, vertical: number): boolean {    
    const isValidBasicMove: boolean = (Math.abs(horizontal) === 1 && Math.abs(vertical) === 0) ||
                                      (Math.abs(horizontal) === 0 && Math.abs(vertical) === 1) ||  
                                      (Math.abs(horizontal) === 1 && Math.abs(vertical) === 1);

    const mustIJump: boolean = this.mustIJump(king, horizontal, vertical);

    const someoneBlockingRook: ChessPiece = this.game.getChessPiece(this.field(1,king.isBlack ? 0 : 7))
    const isValidCastlingLeft: boolean = (king.castlingLeftStatus !== CastlingStatus.NOT_ALLOWED &&
                                         !king.isCheckMove && !someoneBlockingRook && horizontal === -2);
    const isValidCastlingRight: boolean = (king.castlingRightStatus !== CastlingStatus.NOT_ALLOWED &&
                                          !king.isCheckMove && horizontal === 2); 

    const verdict: boolean = (isValidBasicMove || isValidCastlingLeft || isValidCastlingRight) && !mustIJump;

    if(king.castlingLeftStatus === CastlingStatus.ABOUT_TO_CASTLE) {
      king.castlingLeftStatus = CastlingStatus.ALLOWED;
    }
    
    if(king.castlingRightStatus === CastlingStatus.ABOUT_TO_CASTLE) {
      king.castlingRightStatus = CastlingStatus.ALLOWED;
    }

    if (verdict && isValidCastlingLeft) {
      king.castlingLeftStatus = CastlingStatus.ABOUT_TO_CASTLE;
    } 
    
    if (verdict && isValidCastlingRight) {
      king.castlingRightStatus = CastlingStatus.ABOUT_TO_CASTLE;
    } 

    return verdict;
  }  

  private isPawnMoveAllowed(pawn: ChessPiece, horizontal: number, vertical: number): boolean {   
    const isDirectionValid: boolean = pawn.isBlack ? Math.sign(vertical) === 1 : Math.sign(vertical) === -1; 

    const chessPieceToBeRemoved = this.game.getChessPiece(this.field(pawn.to.x,pawn.to.y));
    const chessPieceToBeRemovedEnPassant = this.game.getChessPiece(this.field(pawn.to.x,pawn.to.y-Math.sign(vertical)));

    const isMoveBesidesJumpingValid: boolean = 
      (!chessPieceToBeRemoved && horizontal === 0 && Math.abs(vertical) === 1) ||
      (!chessPieceToBeRemoved && horizontal === 0 && Math.abs(vertical) === 2 && [1,6].indexOf(pawn.from.y) > -1);

    const canIKickSomeoneOffTheBoard: boolean = 
      (chessPieceToBeRemoved && Math.abs(horizontal) === 1 && Math.abs(vertical) === 1);
    const canIKickSomeoneOffTheBoardEnPassant: boolean = (chessPieceToBeRemovedEnPassant && 
      chessPieceToBeRemovedEnPassant.enPassantStatus !== EnPassantStatus.NOT_ALLOWED && 
      Math.abs(horizontal) === 1 && Math.abs(vertical) === 1);

    const mustIJump: boolean = this.mustIJump(pawn, horizontal, vertical);

    const verdict: boolean = isDirectionValid && !mustIJump &&
      (isMoveBesidesJumpingValid || canIKickSomeoneOffTheBoard || canIKickSomeoneOffTheBoardEnPassant) ? true : false;

    if (verdict && canIKickSomeoneOffTheBoardEnPassant) {
      chessPieceToBeRemovedEnPassant.enPassantStatus = EnPassantStatus.ABOUT_TO_BE_KICKED_OFF;
    }
    
    return verdict;
  }  
}
