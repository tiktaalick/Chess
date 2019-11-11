import { TurnPhase } from './../constants';
import { ChessBoard } from './../interfaces';
import { GameService } from './game.service';
import { Injectable } from '@angular/core';
import { ChessPiece, Coordinates } from '../interfaces';
import { ChessPieceType, CastlingStatus, EnPassantStatus } from '../constants';
import { EnPassantService } from './en-passant.service';

@Injectable({
  providedIn: 'root'
})
export class RulesService {

  constructor(private game: GameService, private enPassant: EnPassantService) { }

  public handleEnPassant(chessBoard: ChessBoard, movingChessPiece: ChessPiece): ChessPiece {
    console.log('handleEnPassant: ' + chessBoard.turnPhase);

    return this.enPassant.handleEnPassant(chessBoard, movingChessPiece);
  }

  public isMoveAllowed(chessBoard: ChessBoard, movingChessPiece: ChessPiece): boolean {
    console.log('isMoveAllowed: ' + chessBoard.turnPhase);
    console.log('('+movingChessPiece.from.x+','+movingChessPiece.from.y+') => ('+movingChessPiece.to.x+','+movingChessPiece.to.y+')');

    const horizontal = movingChessPiece.to.x - movingChessPiece.from.x; 
    const vertical = movingChessPiece.to.y - movingChessPiece.from.y;
    const chessPieceToBeRemoved: ChessPiece = this.game.getChessPiece(chessBoard, this.game.field(movingChessPiece.to.x,movingChessPiece.to.y));
    let isMoveAllowed: boolean = false;

    if (chessPieceToBeRemoved && chessPieceToBeRemoved.isBlack === movingChessPiece.isBlack) {
      return false;
    }

    if (movingChessPiece.to.x >= 8 || movingChessPiece.to.y >= 8) {
      return false;
    } 
    
    if (movingChessPiece.type === ChessPieceType.ROOK) {
      isMoveAllowed = this.isRookMoveAllowed(chessBoard, movingChessPiece, horizontal, vertical);
    } 

    if (movingChessPiece.type === ChessPieceType.KNIGHT) {
      isMoveAllowed = this.isKnightMoveAllowed(horizontal, vertical);
    }

    if (movingChessPiece.type === ChessPieceType.BISHOP) {
      isMoveAllowed = this.isBishopMoveAllowed(chessBoard, movingChessPiece, horizontal, vertical);
    }

    if (movingChessPiece.type === ChessPieceType.QUEEN) {
      isMoveAllowed = this.isQueenMoveAllowed(chessBoard, movingChessPiece, horizontal, vertical);
    } 
    
    if (movingChessPiece.type === ChessPieceType.KING) {
      isMoveAllowed = this.isKingMoveAllowed(chessBoard, movingChessPiece, horizontal, vertical);
    } 

    if (movingChessPiece.type === ChessPieceType.PAWN) {
      isMoveAllowed = this.isPawnMoveAllowed(chessBoard, movingChessPiece, horizontal, vertical);
    } 

    if (isMoveAllowed && chessPieceToBeRemoved) {
      chessPieceToBeRemoved.isUnderAttack = true;
      console.log((chessPieceToBeRemoved.isBlack ? 'Black ' : 'White ') + 
        chessPieceToBeRemoved.type+'('+chessPieceToBeRemoved.from.x+','+chessPieceToBeRemoved.from.y+') is under attack!');
    }

    return isMoveAllowed;
  }  

  private mustIJump(chessBoard: ChessBoard, movingChessPiece: ChessPiece, horizontal: number, vertical: number): boolean {   
    const stepX = Math.sign(horizontal);
    const stepY = Math.sign(vertical);
    const startX = movingChessPiece.from.x + stepX;
    const startY = movingChessPiece.from.y + stepY;

    for (let dragPosition: Coordinates = {x: startX, y: startY}; 
      dragPosition.x !== movingChessPiece.to.x || 
      dragPosition.y !== movingChessPiece.to.y; 
      dragPosition.x += stepX, dragPosition.y += stepY) {
        let obstacle: ChessPiece = chessBoard.chessPieces.find(chessPiece => chessPiece.from.x === dragPosition.x && 
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

  private isRookMoveAllowed(chessBoard: ChessBoard, rook: ChessPiece, horizontal: number, vertical: number): boolean {   
    const isBesidesJumpingValid: boolean = (horizontal !== 0 && vertical === 0) ||
                                           (horizontal === 0 && vertical !== 0);

    const mustIJump: boolean = this.mustIJump(chessBoard, rook, horizontal, vertical);
    
    return isBesidesJumpingValid && !mustIJump ? true : false;
  }  

  private isKnightMoveAllowed(horizontal: number, vertical: number): boolean {    
    return (Math.abs(horizontal) === 2 && Math.abs(vertical) === 1) ||
           (Math.abs(horizontal) === 1 && Math.abs(vertical) === 2);
  }  

  private isBishopMoveAllowed(chessBoard: ChessBoard, bishop: ChessPiece, horizontal: number, vertical: number): boolean {   
    const isBesidesJumpingValid: boolean = (Math.abs(horizontal) === Math.abs(vertical));
    const mustIJump: boolean = this.mustIJump(chessBoard, bishop, horizontal, vertical);
    
    return isBesidesJumpingValid && !mustIJump ? true : false;
  }  

  private isQueenMoveAllowed(chessBoard: ChessBoard, queen: ChessPiece, horizontal: number, vertical: number): boolean {   
    const isBesidesJumpingValid: boolean = (horizontal !== 0 && vertical === 0) ||
                                         (horizontal === 0 && vertical !== 0) ||
                                         (Math.abs(horizontal) === Math.abs(vertical));

    const mustIJump: boolean = this.mustIJump(chessBoard, queen, horizontal, vertical);
    
    return isBesidesJumpingValid && !mustIJump ? true : false;
  }  

  private isKingMoveAllowed(chessBoard: ChessBoard, king: ChessPiece, horizontal: number, vertical: number): boolean {    
    const isValidBasicMove: boolean = (Math.abs(horizontal) === 1 && Math.abs(vertical) === 0) ||
                                      (Math.abs(horizontal) === 0 && Math.abs(vertical) === 1) ||  
                                      (Math.abs(horizontal) === 1 && Math.abs(vertical) === 1);

    const mustIJump: boolean = this.mustIJump(chessBoard, king, horizontal, vertical);

    const someoneBlockingRook: ChessPiece = this.game.getChessPiece(chessBoard, this.game.field(1,king.isBlack ? 0 : 7))
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

  private isPawnMoveAllowed(chessBoard: ChessBoard, pawn: ChessPiece, horizontal: number, vertical: number): boolean {   
    const isDirectionValid: boolean = pawn.isBlack ? Math.sign(vertical) === 1 : Math.sign(vertical) === -1; 

    const chessPieceToBeRemoved = this.game.getChessPiece(chessBoard, this.game.field(pawn.to.x,pawn.to.y));
    
    const isMoveBesidesJumpingValid: boolean = 
      (!chessPieceToBeRemoved && horizontal === 0 && Math.abs(vertical) === 1) ||
      (!chessPieceToBeRemoved && horizontal === 0 && Math.abs(vertical) === 2 && [1,6].indexOf(pawn.from.y) > -1);

    const canIKickSomeoneOffTheBoard: boolean = 
      (chessPieceToBeRemoved && Math.abs(horizontal) === 1 && Math.abs(vertical) === 1);
    let chessPieceToBeRemovedEnPassant: ChessPiece = this.enPassant.canIKickSomeoneOffTheBoardEnPassant(chessBoard, pawn, horizontal, vertical);

    const mustIJump: boolean = this.mustIJump(chessBoard, pawn, horizontal, vertical);

    const verdict: boolean = isDirectionValid && !mustIJump &&
      (isMoveBesidesJumpingValid || canIKickSomeoneOffTheBoard || chessPieceToBeRemovedEnPassant) ? true : false;

    if (verdict && chessPieceToBeRemovedEnPassant) {
      chessPieceToBeRemovedEnPassant.enPassantStatus = EnPassantStatus.ABOUT_TO_BE_KICKED_OFF;
    }
    
    return verdict;
  }  

}
