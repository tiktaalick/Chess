import { ChessBoard } from './../interfaces';
import { ChessPiece } from '../interfaces';
import { ChessBoardService } from './chess-board.service';
import { Injectable } from '@angular/core';
import { EnPassantStatus, ChessPieceType } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class EnPassantService {

  constructor(private chessBoard: ChessBoardService) { }

  public handleEnPassant(chessBoard: ChessBoard, movingChessPiece: ChessPiece): ChessBoard {
    console.log('handleEnPassant: ' + chessBoard.turnPhase);

    let chessPieceToBeRemovedEnPassant: ChessPiece = chessBoard.chessPieces.find(chessPiece => chessPiece.enPassantStatus === EnPassantStatus.ABOUT_TO_BE_KICKED_OFF);
    
    let resetEnPassant: ChessPiece = chessBoard.chessPieces.find(chessPiece => chessPiece.enPassantStatus === EnPassantStatus.ALLOWED);
    if (resetEnPassant) {
      resetEnPassant.enPassantStatus = EnPassantStatus.NOT_ALLOWED;
    }

    if (movingChessPiece.type === ChessPieceType.PAWN &&
        Math.abs(movingChessPiece.to.y - movingChessPiece.from.y) === 2) {
      movingChessPiece.enPassantStatus = EnPassantStatus.ALLOWED;
      chessBoard = this.chessBoard.updateChessPiece(chessBoard, movingChessPiece);    
    } 

    if (chessPieceToBeRemovedEnPassant) {
      chessBoard = this.chessBoard.removeChessPiece(chessBoard, chessPieceToBeRemovedEnPassant);    
    }
    
    return chessBoard;
  }

  public canIKickSomeoneOffTheBoardEnPassant(chessBoard: ChessBoard, pawn:ChessPiece, horizontal: number, vertical: number): ChessPiece {
    const chessPieceToBeRemovedEnPassant = this.chessBoard.getChessPiece(chessBoard, this.chessBoard.field(pawn.to.x,pawn.to.y-Math.sign(vertical)));

    if (chessPieceToBeRemovedEnPassant && 
      chessPieceToBeRemovedEnPassant.enPassantStatus !== EnPassantStatus.NOT_ALLOWED && 
      Math.abs(horizontal) === 1 && Math.abs(vertical) === 1) {
        return chessPieceToBeRemovedEnPassant;
    } 

    return null;
  }

}
