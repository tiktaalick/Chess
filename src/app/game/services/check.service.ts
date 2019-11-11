import { TurnPhase, ChessPieceType } from './../constants';
import { ChessBoard } from './../interfaces';
import { RulesService } from './rules.service';
import { Injectable } from '@angular/core';
import { ChessPiece, Coordinates } from '../interfaces';
import { BehaviorSubject } from 'rxjs';
import { GameService } from './game.service';

@Injectable({
  providedIn: 'root'
})
export class CheckService {
  public checkMove$: BehaviorSubject<number> = new BehaviorSubject<number>(null);
  public resetCheckMove$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

  constructor(private game: GameService, private rules: RulesService) { }

  public handleCheck(isBlack: boolean, chessBoard: ChessBoard, ignorePiecesUnderAttack: boolean): ChessPiece {
    console.log('handleCheck: ' + chessBoard.turnPhase);

    let king: ChessPiece = chessBoard.chessPieces.find(
      chessPiece => 
        chessPiece.type === ChessPieceType.KING &&
        chessPiece.isBlack === isBlack
    );

    let isCheck: boolean = false;
    let checkPiece: ChessPiece;

    if (ignorePiecesUnderAttack) {
      chessBoard.chessPieces.forEach(chessPiece => {
        if (chessPiece.isUnderAttack && chessPiece.isBlack != isBlack) {
          let index: number = chessBoard.chessPieces.indexOf(chessPiece);
          chessBoard.chessPieces.splice(index,1);
        }
      })
    };

    for (let x = 1; x < chessBoard.chessPieces.length; x++) {
      let chessPiece: ChessPiece = chessBoard.chessPieces[x];

      if (!isCheck && chessPiece.isBlack !== isBlack) { 
        let oldToX = chessPiece.to.x;
        let oldToY = chessPiece.to.y;
        chessPiece.to.x = king.from.x;
        chessPiece.to.y = king.from.y;
        isCheck = this.rules.isMoveAllowed(chessBoard,chessPiece);
        chessPiece.to.x = oldToX;
        chessPiece.to.y = oldToY;
        if (isCheck) {
          checkPiece = chessPiece;
          console.log('Check: '+chessPiece.type+' ('+chessPiece.from.x+','+chessPiece.from.y+') => ('+king.from.x+','+king.from.y+')');
          break;
        } 
      }
    }

    if(checkPiece) {
      this.showCheckMove({x: king.from.x, y: king.from.y});
      this.showCheckMove({x: checkPiece.from.x, y: checkPiece.from.y});
      king.isUnderAttack = true;
    }

    return checkPiece;
  }

  public doIPutMyselfInCheck(chessBoard: ChessBoard, movingChessPiece: ChessPiece, checkForNoMoreMoves: boolean) {
    chessBoard = this.game.cloneChessBoard(chessBoard,TurnPhase.PLAYER_CHECK);
    
    let localMovingChessPiece = chessBoard.chessPieces.find(chessPiece => chessPiece.id === movingChessPiece.id);    
 
    localMovingChessPiece.from.x = movingChessPiece.to.x;
    localMovingChessPiece.from.y = movingChessPiece.to.y;
    localMovingChessPiece.to.x = movingChessPiece.to.x;
    localMovingChessPiece.to.y = movingChessPiece.to.y;

    const checkPiece: ChessPiece = this.handleCheck(localMovingChessPiece.isBlack, chessBoard, checkForNoMoreMoves);

    return checkPiece;
  }
  
  public showCheckMove(coordinates: Coordinates) {
    console.log('showCheckMove: ('+coordinates.x+','+coordinates.y+')');
    this.checkMove$.next(this.game.field(coordinates.x,coordinates.y));
  }

  public resetCheckMove() {
    this.resetCheckMove$.next(!this.resetCheckMove);
  }
}
