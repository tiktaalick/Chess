import { Injectable } from '@angular/core';
import { ChessPiece } from '../interfaces';
import { ChessPieceType } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class PromotePawnService {

  constructor() { }

  public promotePawn(movingChessPiece: ChessPiece): ChessPiece {
    if (movingChessPiece.type === ChessPieceType.PAWN && [0,7].indexOf(movingChessPiece.to.y) > -1) {
      movingChessPiece.type = ChessPieceType.QUEEN;
    }
    
    return movingChessPiece;
  }
}
