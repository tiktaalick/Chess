import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChessPiece, Coordinates } from '../interfaces';
import { ChessPieceType} from '../constants';

@Injectable()
export class GameService implements OnDestroy {
  public chessPieces$: BehaviorSubject<ChessPiece[]> = this.initializeChessPieces$();
  public chessPieces: ChessPiece[];
  public coordinates(i: number): Coordinates {
    return {
      x: i % 8,
      y: Math.floor(i / 8)
    }
  }
  
  constructor() {
    this.chessPieces$.subscribe(chessPieces => {
      this.chessPieces = chessPieces;
    })

  }

  ngOnDestroy(): void {
    this.chessPieces$.unsubscribe();
  }

  public getChessPiece(field: number): ChessPiece {
    const fieldX = this.coordinates(field).x;
    const fieldY = this.coordinates(field).y;

    return this.chessPieces.find(
      chessPiece => chessPiece.from.x === fieldX && chessPiece.from.y === fieldY);    
  }

  private initializeChessPieces$(): BehaviorSubject<ChessPiece[]> {
    const chessPieces: ChessPiece[] = [];
    
    chessPieces.push(this.createChessPiece(1, ChessPieceType.KNIGHT, true, {x: 1, y: 0}));
    chessPieces.push(this.createChessPiece(2, ChessPieceType.QUEEN, true, {x: 3, y: 0}));
    chessPieces.push(this.createChessPiece(3, ChessPieceType.KNIGHT, true, {x: 6, y: 0}));
    
    chessPieces.push(this.createChessPiece(4, ChessPieceType.KNIGHT, false, {x: 1, y: 7}));
    chessPieces.push(this.createChessPiece(5, ChessPieceType.QUEEN, false, {x: 3, y: 7}));
    chessPieces.push(this.createChessPiece(6, ChessPieceType.KNIGHT, false, {x: 6, y: 7}));

    return new BehaviorSubject<ChessPiece[]>(chessPieces);
  }

  private createChessPiece(id: number, type: string, isBlack: boolean, coordinates): ChessPiece {
    const chessPiece: ChessPiece = {
      id: id,
      type: type,
      isBlack: isBlack,
      from: {x: coordinates.x, y: coordinates.y},
      to: {x: coordinates.x, y: coordinates.y},
      myTurn: false
    }; 

    return chessPiece;
  }

  public hasAChessPieceOfType(field: number, type: string): boolean {
    const chessPiece: ChessPiece = this.getChessPiece(field);

    return chessPiece && chessPiece.type === type ? true : false;
  }

}
