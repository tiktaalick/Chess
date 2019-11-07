import { MoveService } from './../services/move.service';
import { GameService } from '../services/game.service';
import { Component, OnDestroy } from '@angular/core';
import { Field, ChessPiece } from '../interfaces';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnDestroy{
  private validMove$ = this.move.validMove$;
  private resetValidMove$ = this.move.resetValidMove$;
  private checkMove$ = this.move.checkMove$;
  
  public fields: Field[] = this.createFieldArray();
  
  constructor(private game: GameService, private move: MoveService) { 
    this.validMove$.subscribe(move => {
      if(this.fields[move]) {
        this.fields[move].isValidMove = true;
      }  
    });

    this.resetValidMove$.subscribe(move => {
      if(this.fields[move]) {
        this.fields[move].isValidMove = false;
      }  

      this.fields.forEach(field => field.isCheckMove = false);
    });

    this.checkMove$.subscribe(move => {
      if(this.fields[move]) {
        this.fields[move].isCheckMove = true;        
      }  
    });
  }  

  ngOnDestroy(): void {
    this.validMove$.unsubscribe();
    this.resetValidMove$.unsubscribe();
  }

  private createFieldArray(): Field[] {
    var fields = [];
    for (let i = 0; i < 64; i++) {
      const field: Field = {
        number: i,
        isValidMove: false,
        isCheckMove: false
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
    return this.game.getChessPiece(field) ? true : false;
  }

  public getChessPiece(field: number): ChessPiece {
    return this.game.getChessPiece(field);
  }

  public isDragDisabled(field: number) {
    const chessPiece: ChessPiece = this.game.getChessPiece(field);

    return chessPiece && chessPiece.myTurn ? false : true;
  }

  public isChessPieceBlack(field: number) {
    const chessPiece: ChessPiece = this.game.getChessPiece(field);

    return chessPiece && chessPiece.isBlack ? true : false;
  }

  public onDragMoved(event: any, field: number) {
    const movingChessPiece: ChessPiece = this.move.isMoveAllowed(event, field, true);

    if(movingChessPiece) {
      this.move.showValidMove(movingChessPiece.to);
    }  
  }

  public onDragEnded(event: any, field: number) {
    const movingChessPiece: ChessPiece = this.move.isMoveAllowed(event, field, false);

    if(movingChessPiece) {
      this.move.moveChessPiece(movingChessPiece);      
    } 
    
    event.source.reset();
  }
}
