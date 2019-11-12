import { CheckService } from './check.service';
import { RulesService } from './rules.service';
import { GameService } from './game.service';
import { Injectable } from '@angular/core';
import { ChessBoard, ChessPiece } from '../interfaces';
import { TurnPhase } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class NoMoreMovesService {

  constructor(private game: GameService, private rules: RulesService, private check: CheckService) { }

  public async handleNoMoreMoves(chessBoard: ChessBoard, isBlack: boolean): Promise<void> {
    chessBoard = this.game.cloneChessBoard(chessBoard,TurnPhase.OTHER_MOVES);

    console.log('handleNoMoreMoves: ' + chessBoard.turnPhase);
    console.log('isBlack: ' + isBlack);
    
    let isValidMoveFound: boolean = false;

    validmoves:
    for (let cp = chessBoard.chessPieces.length - 1; cp > -1; cp--) {
      let chessPiece: ChessPiece = chessBoard.chessPieces[cp];
      if (chessPiece.isBlack === isBlack) {
        for (let f = 0; f < 64; f++) {
          const chessBoardBackup = this.game.cloneChessBoard(chessBoard,TurnPhase.OTHER_MOVES);
          const oldFromX = chessPiece.from.x;
          const oldFromY = chessPiece.from.y;
          const oldToX = chessPiece.to.x;
          const oldToY = chessPiece.to.y;
          chessPiece.to.x = this.game.coordinates(f).x;
          chessPiece.to.y = this.game.coordinates(f).y;
          const correctMovingChessPiece = this.check.checkTheRules(chessBoard,chessPiece);
          chessPiece.from.x = oldFromX;
          chessPiece.from.y = oldFromY;
          chessPiece.to.x = oldToX;
          chessPiece.to.y = oldToY;
          chessBoard = chessBoardBackup;
          if (correctMovingChessPiece) {
            console.log('Valid move: '+chessPiece.type+' ('+chessPiece.from.x+','+chessPiece.from.y+') => ('+this.game.coordinates(f).x+','+this.game.coordinates(f).y+')');
            isValidMoveFound = true; 
            break validmoves;
          }
        }
      }
    }

    if (!isValidMoveFound) {
      console.log('isBlack='+isBlack+': no more moves');
    }
  }
}
