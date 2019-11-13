import { ChessBoardService } from './chess-board.service';
import { Injectable } from '@angular/core';
import { ChessPiece, ChessBoard } from '../interfaces';
import { ChessPieceType } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class PromotePawnService {

  constructor(private chessBoard: ChessBoardService) { }

  public promotePawn(chessBoard: ChessBoard, movingChessPiece: ChessPiece): ChessBoard {
    if (movingChessPiece.type === ChessPieceType.PAWN && [0,7].indexOf(movingChessPiece.to.y) > -1) {
      movingChessPiece.type = ChessPieceType.QUEEN;

      chessBoard = this.chessBoard.updateChessPiece(chessBoard, movingChessPiece);      
    }

    return chessBoard;
  }
}
