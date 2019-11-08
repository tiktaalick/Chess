import { ChessPiece, Coordinates } from '../interfaces';
import { CastlingStatus, TILE_SIZE, ChessPieceType, EnPassantStatus } from '../constants';
import * as _ from 'lodash';
import { Injectable, OnDestroy } from '@angular/core';
import { GameService } from './game.service';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class MoveService implements OnDestroy {
  public validMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public resetValidMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public checkMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public resetCheckMove$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
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
    if(chessPieceToBeRemoved) {
      let localChessPieces = _.cloneDeep(this.game.chessPieces);
      let localChessPiece = localChessPieces.find(chessPiece => chessPiece.id === chessPieceToBeRemoved.id); 
      const index: number = localChessPieces.indexOf(localChessPiece);

      if (index > -1) {
        localChessPieces.splice(index,1);
        this.game.chessPieces$.next(localChessPieces);
      }
    }
  }

  private handleEnPassant(movingChessPiece: ChessPiece): ChessPiece {
    let localChessPieces = _.cloneDeep(this.game.chessPieces); 
    let chessPieceToBeRemovedEnPassent: ChessPiece = localChessPieces.find(chessPiece => chessPiece.enPassantStatus === EnPassantStatus.ABOUT_TO_BE_KICKED_OFF);
    this.removeChessPiece(chessPieceToBeRemovedEnPassent);
    
    let resetEnPassent: ChessPiece = localChessPieces.find(chessPiece => chessPiece.enPassantStatus === EnPassantStatus.ALLOWED);
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
    let localChessPieces = _.cloneDeep(this.game.chessPieces); 
    let rookToCastle: ChessPiece = localChessPieces.find(
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
    let localChessPieces = _.cloneDeep(this.game.chessPieces); 
    const index: number = localChessPieces.findIndex(
      chessPiece => chessPiece.type === ChessPieceType.KING && 
                    chessPiece.isBlack === rookToCastle.isBlack); 
    localChessPieces[index].castlingLeftStatus = castleLeft 
                    ? CastlingStatus.NOT_ALLOWED 
                    : localChessPieces[index].castlingLeftStatus;
    localChessPieces[index].castlingRightStatus = castleLeft 
                    ? localChessPieces[index].castlingRightStatus 
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

  private handleCheck(isBlack: boolean, localChessPieces: ChessPiece[]): ChessPiece {
    let king: ChessPiece = localChessPieces.find(
      chessPiece => 
        chessPiece.type === ChessPieceType.KING &&
        chessPiece.isBlack === isBlack
    );

    let isCheck: boolean = false;
    let checkPiece: ChessPiece;

    for (let x = 1; x < localChessPieces.length; x++) {
      let chessPiece: ChessPiece = localChessPieces[x];
      if (!isCheck && chessPiece.isBlack !== isBlack && 
            !(king.from.x === chessPiece.to.x && 
              king.from.y === chessPiece.to.y)) {
          let oldToX = chessPiece.to.x;
          let oldToY = chessPiece.to.y;
          chessPiece.to.x = king.from.x;
          chessPiece.to.y = king.from.y;
          isCheck = this.isMoveAllowed(localChessPieces,chessPiece);
          chessPiece.to.x = oldToX;
          chessPiece.to.y = oldToY;
          if (isCheck) {
            checkPiece = chessPiece;
            break;
          } 
        }
      };

    if(checkPiece) {
      this.showCheckMove({x: king.from.x, y: king.from.y});
      this.showCheckMove({x: checkPiece.from.x, y: checkPiece.from.y});
      king.isCheckMove = true;
    }

    return checkPiece;
  }

  private handleNoMoreMoves(isBlack: boolean) {
    let isValidMoveFound: boolean = false;
    let localChessPieces = _.cloneDeep(this.game.chessPieces);

    validmoves:
    for (let cp = 0; cp < localChessPieces.length; cp++) {
      let chessPiece: ChessPiece = localChessPieces[cp];
      if (!isValidMoveFound && chessPiece.isBlack === isBlack) {
        for (let f = 0; f < 64; f++) {
          let oldToX = chessPiece.to.x;
          let oldToY = chessPiece.to.y;
          chessPiece.to.x = this.game.coordinates(f).x;
          chessPiece.to.y = this.game.coordinates(f).y;
          isValidMoveFound = this.isMoveAllowed(localChessPieces,chessPiece) && !this.doIPutMyselfInCheck(chessPiece);
          chessPiece.to.x = oldToX;
          chessPiece.to.y = oldToY;
          if (isValidMoveFound) {
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
    let localChessPieces = _.cloneDeep(this.game.chessPieces); 
    let localMovingChessPiece = localChessPieces.find(chessPiece => chessPiece.id === movingChessPiece.id);
    
    localMovingChessPiece = this.handleEnPassant(localMovingChessPiece);
    localMovingChessPiece = this.handleCastling(localMovingChessPiece);
    localMovingChessPiece = this.promotePawn(localMovingChessPiece);

    const to: number = this.field(localMovingChessPiece.to.x,localMovingChessPiece.to.y);
    const chessPieceToBeRemoved: ChessPiece = this.game.getChessPiece(to);    
    this.removeChessPiece(chessPieceToBeRemoved)
    
    localMovingChessPiece.from.x = localMovingChessPiece.to.x;
    localMovingChessPiece.from.y = localMovingChessPiece.to.y;
    localChessPieces.forEach(chessPiece => chessPiece.isCheckMove = false);
    
    this.game.chessPieces$.next(localChessPieces);

    this.handleNoMoreMoves(!localMovingChessPiece.isBlack);

    this.resetValidMove(this.dragPosition);
    this.resetCheckMove();
    this.isBlackMove$.next(!this.isBlackMove$.getValue());

    this.handleCheck(!localMovingChessPiece.isBlack, localChessPieces);
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

  public doIPutMyselfInCheck(movingChessPiece: ChessPiece) {
    let localChessPieces = _.cloneDeep(this.game.chessPieces);
    let localMovingChessPiece = localChessPieces.find(chessPiece => chessPiece.id === movingChessPiece.id);    
 
    localMovingChessPiece.from.x = movingChessPiece.to.x;
    localMovingChessPiece.from.y = movingChessPiece.to.y;
    localMovingChessPiece.to.x = movingChessPiece.to.x;
    localMovingChessPiece.to.y = movingChessPiece.to.y;

    const checkPiece: ChessPiece = this.handleCheck(localMovingChessPiece.isBlack, localChessPieces);

    return checkPiece;
  }
  
  public checkTheRules(event: any, field: number, isMoving: boolean): ChessPiece {
    const movingChessPiece: ChessPiece = this.game.getChessPiece(field);

    if (!movingChessPiece) {
      return null;
    }

    movingChessPiece.to.x = this.getNewPosition(event).x;
    movingChessPiece.to.y = this.getNewPosition(event).y;
    
    const to: number = this.field(movingChessPiece.to.x,movingChessPiece.to.y);

    const checkIfAllowed: boolean = this.doCheckIfAllowed(movingChessPiece, isMoving); 

    if (checkIfAllowed && this.isMoveAllowed(this.game.chessPieces,movingChessPiece)) {
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

  public resetCheckMove() {
    console.log('resetCheckMove!');
    this.resetCheckMove$.next(!this.resetCheckMove);
  }

  private isMoveAllowed(localChessPieces: ChessPiece[], movingChessPiece: ChessPiece): boolean {
    const horizontal = movingChessPiece.to.x - movingChessPiece.from.x; 
    const vertical = movingChessPiece.to.y - movingChessPiece.from.y;
    const chessPieceToBeRemoved: ChessPiece = this.game.getChessPiece(this.field(movingChessPiece.to.x,movingChessPiece.to.y));
    
    if (chessPieceToBeRemoved && chessPieceToBeRemoved.isBlack === movingChessPiece.isBlack) {
      return false;
    } 

    if (movingChessPiece.to.x >= 8 || movingChessPiece.to.y >= 8) {
      return false;
    } 
    
    if (movingChessPiece.type === ChessPieceType.ROOK) {
      return this.isRookMoveAllowed(localChessPieces, movingChessPiece, horizontal, vertical);
    } 

    if (movingChessPiece.type === ChessPieceType.KNIGHT) {
      return this.isKnightMoveAllowed(horizontal, vertical);
    }

    if (movingChessPiece.type === ChessPieceType.BISHOP) {
      return this.isBishopMoveAllowed(localChessPieces, movingChessPiece, horizontal, vertical);
    }

    if (movingChessPiece.type === ChessPieceType.QUEEN) {
      return this.isQueenMoveAllowed(localChessPieces, movingChessPiece, horizontal, vertical);
    } 
    
    if (movingChessPiece.type === ChessPieceType.KING) {
      return this.isKingMoveAllowed(localChessPieces, movingChessPiece, horizontal, vertical);
    } 

    if (movingChessPiece.type === ChessPieceType.PAWN) {
      return this.isPawnMoveAllowed(localChessPieces, movingChessPiece, horizontal, vertical);
    } 
  }  

  private mustIJump(localChessPieces: ChessPiece[], movingChessPiece: ChessPiece, horizontal: number, vertical: number): boolean {   
    const stepX = Math.sign(horizontal);
    const stepY = Math.sign(vertical);
    const startX = movingChessPiece.from.x + stepX;
    const startY = movingChessPiece.from.y + stepY;

    for (let dragPosition: Coordinates = {x: startX, y: startY}; 
      dragPosition.x !== movingChessPiece.to.x || 
      dragPosition.y !== movingChessPiece.to.y; 
      dragPosition.x += stepX, dragPosition.y += stepY) {
        let obstacle: ChessPiece = localChessPieces.find(chessPiece => chessPiece.from.x === dragPosition.x && 
                                                                       chessPiece.from.y === dragPosition.y);
      if (obstacle) {
        return true;
      }

      if (dragPosition.x < 0 || dragPosition.x > 7 || dragPosition.y < 0 || dragPosition.y > 7) {
        return true
      }
    }

    return false;
  }

  private isRookMoveAllowed(localChessPieces: ChessPiece[], rook: ChessPiece, horizontal: number, vertical: number): boolean {   
    const isBesidesJumpingValid: boolean = (horizontal !== 0 && vertical === 0) ||
                                           (horizontal === 0 && vertical !== 0);

    const mustIJump: boolean = this.mustIJump(localChessPieces, rook, horizontal, vertical);
    
    return isBesidesJumpingValid && !mustIJump ? true : false;
  }  

  private isKnightMoveAllowed(horizontal: number, vertical: number): boolean {    
    return (Math.abs(horizontal) === 2 && Math.abs(vertical) === 1) ||
           (Math.abs(horizontal) === 1 && Math.abs(vertical) === 2);
  }  

  private isBishopMoveAllowed(localChessPieces: ChessPiece[], bishop: ChessPiece, horizontal: number, vertical: number): boolean {   
    const isBesidesJumpingValid: boolean = (Math.abs(horizontal) === Math.abs(vertical));
    const mustIJump: boolean = this.mustIJump(localChessPieces, bishop, horizontal, vertical);
    
    return isBesidesJumpingValid && !mustIJump ? true : false;
  }  

  private isQueenMoveAllowed(localChessPieces: ChessPiece[], queen: ChessPiece, horizontal: number, vertical: number): boolean {   
    const isBesidesJumpingValid: boolean = (horizontal !== 0 && vertical === 0) ||
                                         (horizontal === 0 && vertical !== 0) ||
                                         (Math.abs(horizontal) === Math.abs(vertical));

    const mustIJump: boolean = this.mustIJump(localChessPieces, queen, horizontal, vertical);
    
    return isBesidesJumpingValid && !mustIJump ? true : false;
  }  

  private isKingMoveAllowed(localChessPieces: ChessPiece[], king: ChessPiece, horizontal: number, vertical: number): boolean {    
    const isValidBasicMove: boolean = (Math.abs(horizontal) === 1 && Math.abs(vertical) === 0) ||
                                      (Math.abs(horizontal) === 0 && Math.abs(vertical) === 1) ||  
                                      (Math.abs(horizontal) === 1 && Math.abs(vertical) === 1);

    const mustIJump: boolean = this.mustIJump(localChessPieces, king, horizontal, vertical);

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

  private isPawnMoveAllowed(localChessPieces: ChessPiece[], pawn: ChessPiece, horizontal: number, vertical: number): boolean {   
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

    const mustIJump: boolean = this.mustIJump(localChessPieces, pawn, horizontal, vertical);

    const verdict: boolean = isDirectionValid && !mustIJump &&
      (isMoveBesidesJumpingValid || canIKickSomeoneOffTheBoard || canIKickSomeoneOffTheBoardEnPassant) ? true : false;

    if (verdict && canIKickSomeoneOffTheBoardEnPassant) {
      chessPieceToBeRemovedEnPassant.enPassantStatus = EnPassantStatus.ABOUT_TO_BE_KICKED_OFF;
    }
    
    return verdict;
  }  
}
