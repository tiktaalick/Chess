import { Field } from './../interfaces/field';
import { ChessPiece } from './../interfaces/chess.piece';
import { ChessPieceType } from './../constants';
import { GameService } from '../services/game.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  chessPieces$ = this.gameService.chessPieces$;
  validMove$ = this.gameService.validMove$;
  resetMove$ = this.gameService.resetMove$;
  
  fields: Field[] = this.createFieldArray();
  
  constructor(private gameService: GameService) { 
    this.validMove$.subscribe(move => {
      if(this.fields[move]) {
        this.fields[move].isValidMove = true;
      }  
    });

    this.resetMove$.subscribe(move => {
      if(this.fields[move]) {
        this.fields[move].isValidMove = false;
      }  
    });
  }  

  ngOnInit() {
  }

  createFieldArray(): Field[] {
    var fields = [];
    for (let i = 0; i < 64; i++) {
      const field: Field = {
        number: i,
        isValidMove: false
      };
      fields.push(field);
    }    
    return fields;
  }

  getX(field: number): number {
    return this.gameService.coordinates(field).x;
  }
  
  getY(field: number): number {
    return this.gameService.coordinates(field).y;
  }

  isDarkerTile(field: number): boolean {
    return (this.gameService.coordinates(field).x + this.gameService.coordinates(field).y) % 2 === 1;
  }

  hasAKnight(field: number): boolean {
    return this.gameService.hasAChessPieceOfType(field, ChessPieceType.KNIGHT);
  }

  isChessPieceBlack(field: number) {
    const chessPiece: ChessPiece = this.gameService.getChessPiece(field);

    return chessPiece && chessPiece.isBlack ? true : false;
  }

  onDragMoved(event: any, field: number) {
    const movingChessPiece: ChessPiece = this.gameService.isMoveAllowed(event, field, true);

    if(movingChessPiece) {
      this.gameService.showValidMove(movingChessPiece.to);
    }  
  }

  onDragEnded(event: any, field: number) {
    const movingChessPiece: ChessPiece = this.gameService.isMoveAllowed(event, field, false);

    if(movingChessPiece) {
      this.gameService.moveChessPiece(movingChessPiece);      
    } 
    
    event.source.reset();
  }
}
