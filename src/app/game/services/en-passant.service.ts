import { TurnPhase } from './../constants';
import { ChessBoard } from './../interfaces';
import { ChessPiece } from '../interfaces';
import { GameService } from './game.service';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { EnPassantStatus, ChessPieceType } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class EnPassantService {

  constructor(private game: GameService) { }

  public handleEnPassant(chessBoard: ChessBoard, movingChessPiece: ChessPiece): ChessBoard {
    console.log('handleEnPassant: ' + chessBoard.turnPhase);

    let chessPieceToBeRemovedEnPassent: ChessPiece = chessBoard.chessPieces.find(chessPiece => chessPiece.enPassantStatus === EnPassantStatus.ABOUT_TO_BE_KICKED_OFF);
    
    let resetEnPassant: ChessPiece = chessBoard.chessPieces.find(chessPiece => chessPiece.enPassantStatus === EnPassantStatus.ALLOWED);
    if (resetEnPassant) {
      resetEnPassant.enPassantStatus = EnPassantStatus.NOT_ALLOWED;
    }

    if (movingChessPiece.type === ChessPieceType.PAWN &&
        Math.abs(movingChessPiece.to.y - movingChessPiece.from.y) === 2) {
          movingChessPiece.enPassantStatus = EnPassantStatus.ALLOWED;
          const index: number = chessBoard.chessPieces.findIndex(chessPiece => chessPiece.id === movingChessPiece.id);
          chessBoard.chessPieces[index] = movingChessPiece;    
    } 

    if (chessPieceToBeRemovedEnPassent) {
      const index: number = chessBoard.chessPieces.findIndex(chessPiece => chessPiece.id === chessPieceToBeRemovedEnPassent.id);
      chessBoard.chessPieces.splice(index,1);
    }
    
    return chessBoard;
  }

  public canIKickSomeoneOffTheBoardEnPassant(chessBoard: ChessBoard, pawn:ChessPiece, horizontal: number, vertical: number): ChessPiece {
    const chessPieceToBeRemovedEnPassant = this.game.getChessPiece(chessBoard, this.game.field(pawn.to.x,pawn.to.y-Math.sign(vertical)));

    if (chessPieceToBeRemovedEnPassant && 
      chessPieceToBeRemovedEnPassant.enPassantStatus !== EnPassantStatus.NOT_ALLOWED && 
      Math.abs(horizontal) === 1 && Math.abs(vertical) === 1) {
        return chessPieceToBeRemovedEnPassant;
    } 

    return null;
  }

}
