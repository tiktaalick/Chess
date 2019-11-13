import { ChessPieceType } from './../constants';
import { ChessBoard, ChessPiece, Coordinates } from '../interfaces';
import { CheckService } from './check.service';
import { RulesService } from './rules.service';
import { ChessBoardService } from './chess-board.service';
import { Injectable } from '@angular/core';
import { TurnPhase } from '../constants';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoMoreMovesService {
  public playerHasLost$: BehaviorSubject<number> = new BehaviorSubject<number>(null);

  constructor(private chessBoard: ChessBoardService, private rules: RulesService, private check: CheckService) { }

  public async handleNoMoreMoves(chessBoard: ChessBoard, isBlack: boolean): Promise<void> {
    chessBoard = this.chessBoard.cloneChessBoard(chessBoard,TurnPhase.OTHER_MOVES);

    console.log('handleNoMoreMoves: ' + chessBoard.turnPhase);
    console.log('isBlack: ' + isBlack);
    
    let isValidMoveFound: boolean = false;

    validmoves:
    for (let cp = chessBoard.chessPieces.length - 1; cp > -1; cp--) {
      let chessPiece: ChessPiece = chessBoard.chessPieces[cp];
      if (chessPiece.isBlack === isBlack) {
        for (let f = 0; f < 64; f++) {
          const chessBoardBackup = this.chessBoard.cloneChessBoard(chessBoard,TurnPhase.OTHER_MOVES);
          const oldFromX = chessPiece.from.x;
          const oldFromY = chessPiece.from.y;
          const oldToX = chessPiece.to.x;
          const oldToY = chessPiece.to.y;
          chessPiece.to.x = this.chessBoard.coordinates(f).x;
          chessPiece.to.y = this.chessBoard.coordinates(f).y;
          const correctMovingChessPiece = this.check.checkTheRules(chessBoard,chessPiece);
          chessPiece.from.x = oldFromX;
          chessPiece.from.y = oldFromY;
          chessPiece.to.x = oldToX;
          chessPiece.to.y = oldToY;
          chessBoard = chessBoardBackup;
          if (correctMovingChessPiece) {
            console.log('Valid move: '+chessPiece.type+' ('+chessPiece.from.x+','+chessPiece.from.y+') => ('+this.chessBoard.coordinates(f).x+','+this.chessBoard.coordinates(f).y+')');
            isValidMoveFound = true; 
            break validmoves;
          }
        }
      }
    }

    if (!isValidMoveFound) {
      console.log('isBlack='+isBlack+': no more moves');
      let king: ChessPiece = chessBoard.chessPieces.find(chessPiece => chessPiece.isBlack === isBlack && chessPiece.type === ChessPieceType.KING);
      this.showPlayerHasLost({x: king.from.x, y: king.from.y});      
    }
  }

    private showPlayerHasLost(coordinates: Coordinates) {
    console.log('showCheckMove: ('+coordinates.x+','+coordinates.y+')');
    this.playerHasLost$.next(this.chessBoard.field(coordinates.x,coordinates.y));
  }



}
