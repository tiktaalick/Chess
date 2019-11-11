import { PromotePawnService } from './promote-pawn.service';
import { ChessPiece, Coordinates } from '../interfaces';
import { CastlingStatus, TILE_SIZE, ChessPieceType, EnPassantStatus } from '../constants';
import * as _ from 'lodash';
import { Injectable, OnDestroy } from '@angular/core';
import { GameService } from './game.service';
import { BehaviorSubject } from 'rxjs';
import { EnPassantService } from './en-passant.service';
import { CastlingService } from './castling.service';

@Injectable({
  providedIn: 'root'
})
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

  constructor(
    private game: GameService, 
    private enPassant: EnPassantService, 
    private castling: CastlingService, 
    private promote: PromotePawnService) { 
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

  public removeChessPiece(localChessPieces: ChessPiece[], chessPieceToBeRemoved: ChessPiece): ChessPiece[] { 
    if(chessPieceToBeRemoved) {
      let localChessPiece = localChessPieces.find(chessPiece => chessPiece.id === chessPieceToBeRemoved.id); 
      const index: number = localChessPieces.indexOf(localChessPiece);

      if (index > -1) {
        localChessPieces.splice(index,1);
        this.game.chessPieces$.next(localChessPieces);
      }
    }
    return localChessPieces;
  }

  private handleCheck(isBlack: boolean, localChessPieces: ChessPiece[], ignorePiecesUnderAttack: boolean): ChessPiece {
    let king: ChessPiece = localChessPieces.find(
      chessPiece => 
        chessPiece.type === ChessPieceType.KING &&
        chessPiece.isBlack === isBlack
    );

    let isCheck: boolean = false;
    let checkPiece: ChessPiece;

    for (let x = 1; x < localChessPieces.length; x++) {
      let chessPiece: ChessPiece = localChessPieces[x];

      if (ignorePiecesUnderAttack && chessPiece.isUnderAttack) {
        continue;
      }

      if (!isCheck && chessPiece.isBlack !== isBlack) { 
          let oldToX = chessPiece.to.x;
          let oldToY = chessPiece.to.y;
          chessPiece.to.x = king.from.x;
          chessPiece.to.y = king.from.y;
          isCheck = this.isMoveAllowed(localChessPieces,chessPiece);
          chessPiece.to.x = oldToX;
          chessPiece.to.y = oldToY;
          if (isCheck) {
            checkPiece = chessPiece;
            console.log('Check: '+chessPiece.type+' ('+chessPiece.from.x+','+chessPiece.from.y+') => ('+king.from.x+','+king.from.y+')');
            break;
          } 
        }
      };

    if(checkPiece) {
      this.showCheckMove({x: king.from.x, y: king.from.y});
      this.showCheckMove({x: checkPiece.from.x, y: checkPiece.from.y});
      king.isUnderAttack = true;
    }

    return checkPiece;
  }

  private handleNoMoreMoves(localChessPieces: ChessPiece[], isBlack: boolean) {
    let isValidMoveFound: boolean = false;

    validmoves:
    for (let cp = 0; cp < localChessPieces.length; cp++) {
      let chessPiece: ChessPiece = localChessPieces[cp];
      if (!isValidMoveFound && chessPiece.isBlack === isBlack) {
        for (let f = 0; f < 64; f++) {
          let oldFromX = chessPiece.from.x;
          let oldFromY = chessPiece.from.y;
          let oldToX = chessPiece.to.x;
          let oldToY = chessPiece.to.y;
          chessPiece.to.x = this.game.coordinates(f).x;
          chessPiece.to.y = this.game.coordinates(f).y;
          isValidMoveFound = this.isMoveAllowed(localChessPieces,chessPiece);
          let checkPiece: ChessPiece = this.doIPutMyselfInCheck(localChessPieces, chessPiece, true);
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
    let localChessPieces = _.cloneDeep(this.game.chessPieces); 
    let localMovingChessPiece = localChessPieces.find(chessPiece => chessPiece.id === movingChessPiece.id);
    
    let chessPieceToBeRemoved: ChessPiece = this.enPassant.handleEnPassant(localMovingChessPiece);
    localChessPieces = this.removeChessPiece(localChessPieces, chessPieceToBeRemoved);
    
    // Handle castling
    const kingAndRook: ChessPiece[] = this.castling.handleCastling(localChessPieces, localMovingChessPiece);
    localMovingChessPiece = kingAndRook[0];
    let index = localChessPieces.indexOf(kingAndRook[1]);
    if (index > -1) {
      localChessPieces[index] = kingAndRook[1];
    }
    index = localChessPieces.indexOf(kingAndRook[2]);
    if (index > -1) {
      //debugger
      localChessPieces[index] = kingAndRook[2];
      localChessPieces[index].from.x = localChessPieces[index].to.x;
      localChessPieces[index].from.y = localChessPieces[index].to.y;
    }
    
    localMovingChessPiece = this.promote.promotePawn(localMovingChessPiece);

    const to: number = this.field(localMovingChessPiece.to.x,localMovingChessPiece.to.y);
    chessPieceToBeRemoved = this.game.getChessPiece(to);    
    localChessPieces = this.removeChessPiece(localChessPieces, chessPieceToBeRemoved);
    
    localMovingChessPiece.from.x = localMovingChessPiece.to.x;
    localMovingChessPiece.from.y = localMovingChessPiece.to.y;
    localChessPieces.forEach(chessPiece => chessPiece.isUnderAttack = false);
    
    this.game.chessPieces$.next(localChessPieces);

    //this.handleNoMoreMoves(this.game.chessPieces, !localMovingChessPiece.isBlack);

    this.resetValidMove(this.dragPosition);
    this.resetCheckMove();
    this.isBlackMove$.next(!this.isBlackMove$.getValue());

    this.handleCheck(!localMovingChessPiece.isBlack, localChessPieces, false);
  }

  private doCheckIfAllowed(movingChessPiece: ChessPiece, isMoving: boolean): boolean {
    const hasMovedToAnotherField: boolean = this.hasMovedToAnotherField(this.dragPosition, movingChessPiece.to);

    if (isMoving && hasMovedToAnotherField) {
      this.resetValidMove(this.dragPosition);
      this.dragPosition = { x: movingChessPiece.to.x, y: movingChessPiece.to.y };
      // if (movingChessPiece.type === 'bishop' && movingChessPiece.isBlack && movingChessPiece.to.x === 3 && movingChessPiece.to.y === 1) {
      //   debugger;
      // }

      return true;
    } 
    
    if (!isMoving) {
      return true;
    } 
    
    return false;
  }

  public doIPutMyselfInCheck(localChessPieces: ChessPiece[], movingChessPiece: ChessPiece, checkForNoMoreMoves: boolean) {
    let localMovingChessPiece = localChessPieces.find(chessPiece => chessPiece.id === movingChessPiece.id);    
 
    localMovingChessPiece.from.x = movingChessPiece.to.x;
    localMovingChessPiece.from.y = movingChessPiece.to.y;
    localMovingChessPiece.to.x = movingChessPiece.to.x;
    localMovingChessPiece.to.y = movingChessPiece.to.y;

    const checkPiece: ChessPiece = this.handleCheck(localMovingChessPiece.isBlack, localChessPieces, checkForNoMoreMoves);

    if (checkPiece) {
      console.log('CheckPiece: '+checkPiece.type+' ('+checkPiece.from.x+','+checkPiece.from.y+') => ('+checkPiece.to.x+','+checkPiece.to.y+')');
    }

    return checkPiece;
  }
  
  public checkTheRules(event: any, field: number, isMoving: boolean): ChessPiece {
    const movingChessPiece: ChessPiece = this.game.getChessPiece(field);

    if (!movingChessPiece) {
      console.log('No moving chess piece! :-O');
      return null;
    }

    movingChessPiece.to.x = this.getNewPosition(event).x;
    movingChessPiece.to.y = this.getNewPosition(event).y;
    
    const to: number = this.field(movingChessPiece.to.x,movingChessPiece.to.y);

    const checkIfAllowed: boolean = this.doCheckIfAllowed(movingChessPiece, isMoving); 
    const localChessPieces: ChessPiece[] = _.cloneDeep(this.game.chessPieces);

    if (checkIfAllowed && this.isMoveAllowed(localChessPieces, movingChessPiece)) {
      return movingChessPiece;
    } 

    this.doIPutMyselfInCheck(localChessPieces, movingChessPiece, false);
    
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
    this.resetCheckMove$.next(!this.resetCheckMove);
  }

  private isMoveAllowed(localChessPieces: ChessPiece[], movingChessPiece: ChessPiece): boolean {
    const horizontal = movingChessPiece.to.x - movingChessPiece.from.x; 
    const vertical = movingChessPiece.to.y - movingChessPiece.from.y;
    const chessPieceToBeRemoved: ChessPiece = this.game.getChessPiece(this.field(movingChessPiece.to.x,movingChessPiece.to.y));
    let isMoveAllowed: boolean = false;

    if (chessPieceToBeRemoved && chessPieceToBeRemoved.isBlack === movingChessPiece.isBlack) {
      return false;
    }

    if (movingChessPiece.to.x >= 8 || movingChessPiece.to.y >= 8) {
      return false;
    } 
    
    if (movingChessPiece.type === ChessPieceType.ROOK) {
      isMoveAllowed = this.isRookMoveAllowed(localChessPieces, movingChessPiece, horizontal, vertical);
    } 

    if (movingChessPiece.type === ChessPieceType.KNIGHT) {
      isMoveAllowed = this.isKnightMoveAllowed(horizontal, vertical);
    }

    if (movingChessPiece.type === ChessPieceType.BISHOP) {
      isMoveAllowed = this.isBishopMoveAllowed(localChessPieces, movingChessPiece, horizontal, vertical);
    }

    if (movingChessPiece.type === ChessPieceType.QUEEN) {
      isMoveAllowed = this.isQueenMoveAllowed(localChessPieces, movingChessPiece, horizontal, vertical);
    } 
    
    if (movingChessPiece.type === ChessPieceType.KING) {
      isMoveAllowed = this.isKingMoveAllowed(localChessPieces, movingChessPiece, horizontal, vertical);
    } 

    if (movingChessPiece.type === ChessPieceType.PAWN) {
      isMoveAllowed = this.isPawnMoveAllowed(localChessPieces, movingChessPiece, horizontal, vertical);
    } 

    if (isMoveAllowed && chessPieceToBeRemoved) {
      chessPieceToBeRemoved.isUnderAttack = true;
      console.log((chessPieceToBeRemoved.isBlack ? 'Black ' : 'White ') + 
        chessPieceToBeRemoved.type+'('+chessPieceToBeRemoved.from.x+','+chessPieceToBeRemoved.from.y+') is under attack!');
    }

    return isMoveAllowed;
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
                                         !king.isUnderAttack && !someoneBlockingRook && horizontal === -2);
    const isValidCastlingRight: boolean = (king.castlingRightStatus !== CastlingStatus.NOT_ALLOWED &&
                                          !king.isUnderAttack && horizontal === 2); 

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
    
    const isMoveBesidesJumpingValid: boolean = 
      (!chessPieceToBeRemoved && horizontal === 0 && Math.abs(vertical) === 1) ||
      (!chessPieceToBeRemoved && horizontal === 0 && Math.abs(vertical) === 2 && [1,6].indexOf(pawn.from.y) > -1);

    const canIKickSomeoneOffTheBoard: boolean = 
      (chessPieceToBeRemoved && Math.abs(horizontal) === 1 && Math.abs(vertical) === 1);
    let chessPieceToBeRemovedEnPassant: ChessPiece = this.enPassant.canIKickSomeoneOffTheBoardEnPassant(pawn, horizontal, vertical);

    const mustIJump: boolean = this.mustIJump(localChessPieces, pawn, horizontal, vertical);

    const verdict: boolean = isDirectionValid && !mustIJump &&
      (isMoveBesidesJumpingValid || canIKickSomeoneOffTheBoard || chessPieceToBeRemovedEnPassant) ? true : false;

    if (verdict && chessPieceToBeRemovedEnPassant) {
      chessPieceToBeRemovedEnPassant.enPassantStatus = EnPassantStatus.ABOUT_TO_BE_KICKED_OFF;
    }
    
    return verdict;
  }  
}
