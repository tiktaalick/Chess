import { TurnPhase } from '../constants';
import { ChessBoard } from '../interfaces';
import { GameService } from '../services/game.service';
import { ChessBoardService } from '../services/chess-board.service';
import { Component, OnDestroy } from '@angular/core';
import { Field, ChessPiece } from '../interfaces';
import * as _ from 'lodash';
import { CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss']
})
export class ChessBoardComponent implements OnDestroy{
  private validMove$ = this.game.validMove$;
  private resetValidMove$ = this.game.resetValidMove$;
  private checkMove$ = this.game.checkMove$;
  private resetCheckMove$ = this.game.resetCheckMove$;
  private playerHasLost$ = this.game.playerHasLost$;  
  public fields: Field[] = this.createFieldArray();
  
  constructor(
    private chessBoard: ChessBoardService, 
    private game: GameService) { 
    this.validMove$.subscribe(move => {
      if(this.fields[move]) {
        this.fields[move].isValidMove = true;
      }  
    });

    this.resetValidMove$.subscribe(move => {
      if(this.fields[move]) {
        this.fields[move].isValidMove = false;
      }  
    });

    this.checkMove$.subscribe(move => {
      this.fields.forEach(field => {
        if(field.isCheckMove && !this.chessBoard.getChessPiece(this.chessBoard.chessBoard, field.number)) {
          field.isCheckMove = false;
        }
      });
      if(this.fields[move]) {
        this.fields[move].isCheckMove = true;        
      }  
    });

    this.resetCheckMove$.subscribe(move => {
      this.fields.forEach(field => field.isCheckMove = false);
    });

    this.playerHasLost$.subscribe(move => {
      if(this.fields[move]) {
        this.fields[move].playerHasLost = true;
      }  
    });
  }  

  ngOnDestroy(): void {
    this.validMove$.unsubscribe();
    this.resetValidMove$.unsubscribe();
    this.checkMove$.unsubscribe();
    this.resetCheckMove$.unsubscribe();
    this.playerHasLost$.unsubscribe();
  }

  private createFieldArray(): Field[] {
    var fields = [];
    for (let i = 0; i < 64; i++) {
      const field: Field = {
        number: i,
        isValidMove: false,
        isCheckMove: false,
        playerHasLost: false
      };
      fields.push(field);
    }    
    return fields;
  }

  public getX(field: number): number {
    return this.chessBoard.coordinates(field).x;
  }
  
  public getY(field: number): number {
    return this.chessBoard.coordinates(field).y;
  }

  public isDarkerTile(field: number): boolean {
    return (this.chessBoard.coordinates(field).x + this.chessBoard.coordinates(field).y) % 2 === 1;
  }

  public hasAChessPiece(field: number): boolean {
    return this.chessBoard.getChessPiece(this.chessBoard.chessBoard, field) ? true : false;
  }

  public getChessPiece(field: number): ChessPiece {
    return this.chessBoard.getChessPiece(this.chessBoard.chessBoard, field);
  }

  public isDragDisabled(field: number) {
    const chessPiece: ChessPiece = this.chessBoard.getChessPiece(this.chessBoard.chessBoard, field);

    return chessPiece && chessPiece.myTurn ? false : true;
  }

  public isChessPieceBlack(field: number) {
    const chessPiece: ChessPiece = this.chessBoard.getChessPiece(this.chessBoard.chessBoard, field);

    return chessPiece && chessPiece.isBlack ? true : false;
  }

  public onDragMoved(event: CdkDragMove, field: number) {
    let chessBoard: ChessBoard = this.chessBoard.cloneChessBoard(this.chessBoard.chessBoard, TurnPhase.PLAYER_DRAG);
    const movingChessPiece: ChessPiece = this.game.checkTheRulesForActivePlayer(chessBoard, event, field, true, false);

    if(movingChessPiece) {
      this.game.showValidMove(movingChessPiece.to);
    }  

  }

  public onDragEnded(event: CdkDragEnd, field: number) {
    let chessBoard: ChessBoard = this.chessBoard.cloneChessBoard(this.chessBoard.chessBoard, TurnPhase.PLAYER_DRAG_ENDED);
    const movingChessPiece: ChessPiece = this.game.checkTheRulesForActivePlayer(chessBoard, event, field, false, false);
    
    if(movingChessPiece) {
      this.game.moveChessPiece(chessBoard,movingChessPiece);      
    } else {
      console.log('Setting dragging distance to zero')
      this.game.checkTheRulesForActivePlayer(chessBoard, event, field, false, true);
    }

    event.source.reset();
  }
}
