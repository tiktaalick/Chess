import { ChessPiece } from './../interfaces';
import { GameService } from './game.service';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { ChessPieceType, CastlingStatus } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class CastlingService {

  constructor(private game: GameService) { }

  private castleRook(localChessPieces: ChessPiece[], king: ChessPiece, castleLeft: boolean): ChessPiece {
    let rookToCastle: ChessPiece = localChessPieces.find(
      chessPiece => chessPiece.type === ChessPieceType.ROOK && 
                    chessPiece.isBlack === king.isBlack &&
                    (castleLeft 
                      ? chessPiece.castlingLeftStatus === CastlingStatus.ALLOWED 
                      : chessPiece.castlingRightStatus === CastlingStatus.ALLOWED));      
    rookToCastle.to.x = castleLeft ? rookToCastle.from.x + 3 : rookToCastle.from.x - 2;
    return rookToCastle;
    // this.moveChessPiece(rookToCastle);
    // this.isBlackMove$.next(!this.isBlackMove$.getValue());
  }

  private dontCastleKing(localChessPieces: ChessPiece[], rookToCastle: ChessPiece, castleLeft: boolean): ChessPiece {
  const king: ChessPiece = localChessPieces.find(
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

  public handleCastling(localChessPieces: ChessPiece[], movingChessPiece: ChessPiece): ChessPiece[] {
    let kingNotToCastle: ChessPiece;
    let rookToCastle: ChessPiece;
    
    if (movingChessPiece.type === ChessPieceType.KING && movingChessPiece.castlingLeftStatus === CastlingStatus.ABOUT_TO_CASTLE) {
      rookToCastle = this.castleRook(localChessPieces, movingChessPiece, true);
    } 
    
    if (movingChessPiece.type === ChessPieceType.KING && movingChessPiece.castlingRightStatus === CastlingStatus.ABOUT_TO_CASTLE) {
      rookToCastle = this.castleRook(localChessPieces, movingChessPiece, false);
    }

    if (movingChessPiece.type === ChessPieceType.ROOK && movingChessPiece.castlingLeftStatus === CastlingStatus.ALLOWED) {
      kingNotToCastle = this.dontCastleKing(localChessPieces, movingChessPiece, true);
    }

    if (movingChessPiece.type === ChessPieceType.ROOK && movingChessPiece.castlingRightStatus === CastlingStatus.ALLOWED) {
      kingNotToCastle = this.dontCastleKing(localChessPieces, movingChessPiece, false);
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
