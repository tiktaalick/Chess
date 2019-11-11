import { ChessPiece } from '../interfaces';
import { GameService } from './game.service';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { EnPassantStatus, ChessPieceType } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class EnPassantService {
  private field(x: number, y: number): number {
    return x + 8 * y;
  }

  constructor(private game: GameService) { }

  public handleEnPassant(movingChessPiece: ChessPiece): ChessPiece {
    let localChessPieces = _.cloneDeep(this.game.chessPieces); 
    let chessPieceToBeRemovedEnPassent: ChessPiece = localChessPieces.find(chessPiece => chessPiece.enPassantStatus === EnPassantStatus.ABOUT_TO_BE_KICKED_OFF);
    
    let resetEnPassent: ChessPiece = localChessPieces.find(chessPiece => chessPiece.enPassantStatus === EnPassantStatus.ALLOWED);
    if (resetEnPassent) {
      resetEnPassent.enPassantStatus = EnPassantStatus.NOT_ALLOWED;
    }

    if (movingChessPiece.type === ChessPieceType.PAWN &&
        Math.abs(movingChessPiece.to.y - movingChessPiece.from.y) === 2) {
          movingChessPiece.enPassantStatus = EnPassantStatus.ALLOWED;
    } 
    
    return chessPieceToBeRemovedEnPassent;
  }

  public canIKickSomeoneOffTheBoardEnPassant(pawn:ChessPiece, horizontal: number, vertical: number): ChessPiece {
    const chessPieceToBeRemovedEnPassant = this.game.getChessPiece(this.field(pawn.to.x,pawn.to.y-Math.sign(vertical)));

     if (chessPieceToBeRemovedEnPassant && 
      chessPieceToBeRemovedEnPassant.enPassantStatus !== EnPassantStatus.NOT_ALLOWED && 
      Math.abs(horizontal) === 1 && Math.abs(vertical) === 1) {
        return chessPieceToBeRemovedEnPassant;
    } 

    return null;
  }

}
