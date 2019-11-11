import { TILE_SIZE } from '../constants';
import { Component, Input } from '@angular/core';
import { ChessPiece } from '../interfaces';

@Component({
  selector: 'app-chess-piece',
  templateUrl: './chess-piece.component.html',
  styleUrls: ['./chess-piece.component.scss']
})
export class ChessPieceComponent {
  @Input() chessPiece: ChessPiece;
  
  constructor() { }

  public getSource(): string {
    return this.chessPiece.isBlack 
      ? "assets/images/black_"+this.chessPiece.type+".png" 
      : "assets/images/white_"+this.chessPiece.type+".png";
  }

  public getImageSize(): number {
    return TILE_SIZE;
  }
}
