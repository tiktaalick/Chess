import { TurnPhase, ChessPieceType } from './../constants';
import { ChessBoard, Coordinates } from './../interfaces';
import { MoveService } from './../services/move.service';
import { GameService } from '../services/game.service';
import { Component, OnDestroy } from '@angular/core';
import { Field, ChessPiece } from '../interfaces';
import * as _ from 'lodash';
import { CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnDestroy{
  private validMove$ = this.move.validMove$;
  private resetValidMove$ = this.move.resetValidMove$;
  private checkMove$ = this.move.checkMove$;
  private resetCheckMove$ = this.move.resetCheckMove$;
  private playerHasLost$ = this.move.playerHasLost$;  
  public fields: Field[] = this.createFieldArray();
  
  constructor(
    private game: GameService, 
    private move: MoveService) { 
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
        if(field.isCheckMove && !this.game.getChessPiece(this.game.chessBoard, field.number)) {
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
    return this.game.coordinates(field).x;
  }
  
  public getY(field: number): number {
    return this.game.coordinates(field).y;
  }

  public isDarkerTile(field: number): boolean {
    return (this.game.coordinates(field).x + this.game.coordinates(field).y) % 2 === 1;
  }

  public hasAChessPiece(field: number): boolean {
    return this.game.getChessPiece(this.game.chessBoard, field) ? true : false;
  }

  public getChessPiece(field: number): ChessPiece {
    return this.game.getChessPiece(this.game.chessBoard, field);
  }

  public isDragDisabled(field: number) {
    const chessPiece: ChessPiece = this.game.getChessPiece(this.game.chessBoard, field);

    return chessPiece && chessPiece.myTurn ? false : true;
  }

  public isChessPieceBlack(field: number) {
    const chessPiece: ChessPiece = this.game.getChessPiece(this.game.chessBoard, field);

    return chessPiece && chessPiece.isBlack ? true : false;
  }

  public onDragMoved(event: CdkDragMove, field: number) {
    let chessBoard: ChessBoard = this.game.cloneChessBoard(this.game.chessBoard, TurnPhase.PLAYER_DRAG);
    const movingChessPiece: ChessPiece = this.move.checkTheRulesForActivePlayer(chessBoard, event, field, true, false);

    if(movingChessPiece) {
      this.move.showValidMove(movingChessPiece.to);
    }  

  }

  public onDragEnded(event: CdkDragEnd, field: number) {
    let chessBoard: ChessBoard = this.game.cloneChessBoard(this.game.chessBoard, TurnPhase.PLAYER_DRAG_ENDED);
    const movingChessPiece: ChessPiece = this.move.checkTheRulesForActivePlayer(chessBoard, event, field, false, false);
    
    if(movingChessPiece) {
      this.move.moveChessPiece(chessBoard,movingChessPiece);      
    } else {
      console.log('Setting dragging distance to zero')
      this.move.checkTheRulesForActivePlayer(chessBoard, event, field, false, true);
    }

    event.source.reset();
  }
}
