import { ChessPiece, ChessBoard } from './../interfaces';
import { GameService } from './game.service';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { ChessPieceType, CastlingStatus } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class CastlingService {

  constructor(private game: GameService) { }

  private castleRook(chessBoard: ChessBoard, king: ChessPiece, castleLeft: boolean): ChessPiece {
    console.log('castleRook: ' + chessBoard.turnPhase);

    let rookToCastle: ChessPiece = chessBoard.chessPieces.find(
      chessPiece => chessPiece.type === ChessPieceType.ROOK && 
                    chessPiece.isBlack === king.isBlack &&
                    (castleLeft 
                      ? chessPiece.castlingLeftStatus === CastlingStatus.ALLOWED 
                      : chessPiece.castlingRightStatus === CastlingStatus.ALLOWED));      
    rookToCastle.to.x = castleLeft ? rookToCastle.from.x + 3 : rookToCastle.from.x - 2;
    return rookToCastle;
  }

  private dontCastleKing(chessBoard: ChessBoard, rookToCastle: ChessPiece, castleLeft: boolean): ChessPiece {
    console.log('dontCastleKing: ' + chessBoard.turnPhase);

    const king: ChessPiece = chessBoard.chessPieces.find(
    chessPiece => chessPiece.type === ChessPieceType.KING && 
                    chessPiece.isBlack === rookToCastle.isBlack); 
    king.castlingLeftStatus = castleLeft 
                  ? CastlingStatus.NOT_ALLOWED 
                  : king.castlingLeftStatus;
    king.castlingRightStatus = castleLeft 
                  ? king.castlingRightStatus 
                  : CastlingStatus.NOT_ALLOWED;
    return king;
  }

  public handleCastling(chessBoard: ChessBoard, movingChessPiece: ChessPiece): ChessPiece[] {
    console.log('handleCastling: ' + chessBoard.turnPhase);

    let kingNotToCastle: ChessPiece;
    let rookToCastle: ChessPiece;

    if (movingChessPiece.type === ChessPieceType.KING && movingChessPiece.castlingLeftStatus === CastlingStatus.ABOUT_TO_CASTLE) {
      rookToCastle = this.castleRook(chessBoard, movingChessPiece, true);
    } 
    
    if (movingChessPiece.type === ChessPieceType.KING && movingChessPiece.castlingRightStatus === CastlingStatus.ABOUT_TO_CASTLE) {
      rookToCastle = this.castleRook(chessBoard, movingChessPiece, false);
    }

    if (movingChessPiece.type === ChessPieceType.ROOK && movingChessPiece.castlingLeftStatus === CastlingStatus.ALLOWED) {
      kingNotToCastle = this.dontCastleKing(chessBoard, movingChessPiece, true);
    }

    if (movingChessPiece.type === ChessPieceType.ROOK && movingChessPiece.castlingRightStatus === CastlingStatus.ALLOWED) {
      kingNotToCastle = this.dontCastleKing(chessBoard, movingChessPiece, false);
    }

    if([ChessPieceType.KING, ChessPieceType.ROOK].indexOf(movingChessPiece.type) > -1) {
      movingChessPiece.castlingLeftStatus = CastlingStatus.NOT_ALLOWED;
      movingChessPiece.castlingRightStatus = CastlingStatus.NOT_ALLOWED;
    }     

    const kingAndRook: ChessPiece[] = [movingChessPiece];
    kingAndRook[1] = kingNotToCastle;
    kingAndRook[2] = rookToCastle;
    
    return kingAndRook;
  }
}
