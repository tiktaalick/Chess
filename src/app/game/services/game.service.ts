import { ChessPieceType, EnPassantStatus, CastlingStatus } from './../constants';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChessPiece, Coordinates } from '../interfaces';

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
    
    chessPieces.push(this.createChessPiece(1, ChessPieceType.ROOK, true, {x: 0, y: 0}));
    chessPieces.push(this.createChessPiece(2, ChessPieceType.KNIGHT, true, {x: 1, y: 0}));
    chessPieces.push(this.createChessPiece(3, ChessPieceType.BISHOP, true, {x: 2, y: 0}));
    chessPieces.push(this.createChessPiece(4, ChessPieceType.QUEEN, true, {x: 3, y: 0}));
    chessPieces.push(this.createChessPiece(5, ChessPieceType.KING, true, {x: 4, y: 0}));
    chessPieces.push(this.createChessPiece(6, ChessPieceType.BISHOP, true, {x: 5, y: 0}));
    chessPieces.push(this.createChessPiece(7, ChessPieceType.KNIGHT, true, {x: 6, y: 0}));
    chessPieces.push(this.createChessPiece(8, ChessPieceType.ROOK, true, {x: 7, y: 0}));
    chessPieces.push(this.createChessPiece(9, ChessPieceType.PAWN, true, {x: 0, y: 1}));
    chessPieces.push(this.createChessPiece(10, ChessPieceType.PAWN, true, {x: 1, y: 1}));
    chessPieces.push(this.createChessPiece(11, ChessPieceType.PAWN, true, {x: 2, y: 1}));
    chessPieces.push(this.createChessPiece(12, ChessPieceType.PAWN, true, {x: 3, y: 1}));
    chessPieces.push(this.createChessPiece(13, ChessPieceType.PAWN, true, {x: 4, y: 1}));
    chessPieces.push(this.createChessPiece(14, ChessPieceType.PAWN, true, {x: 5, y: 1}));
    chessPieces.push(this.createChessPiece(15, ChessPieceType.PAWN, true, {x: 6, y: 1}));
    chessPieces.push(this.createChessPiece(16, ChessPieceType.PAWN, true, {x: 7, y: 1}));
    
    chessPieces.push(this.createChessPiece(17, ChessPieceType.ROOK, false, {x: 0, y: 7}));
    chessPieces.push(this.createChessPiece(18, ChessPieceType.KNIGHT, false, {x: 1, y: 7}));
    chessPieces.push(this.createChessPiece(19, ChessPieceType.BISHOP, false, {x: 2, y: 7}));
    chessPieces.push(this.createChessPiece(20, ChessPieceType.QUEEN, false, {x: 3, y: 7}));
    chessPieces.push(this.createChessPiece(21, ChessPieceType.KING, false, {x: 4, y: 7}));
    chessPieces.push(this.createChessPiece(22, ChessPieceType.BISHOP, false, {x: 5, y: 7}));
    chessPieces.push(this.createChessPiece(23, ChessPieceType.KNIGHT, false, {x: 6, y: 7}));
    chessPieces.push(this.createChessPiece(24, ChessPieceType.ROOK, false, {x: 7, y: 7}));
    chessPieces.push(this.createChessPiece(25, ChessPieceType.PAWN, false, {x: 0, y: 6}));
    chessPieces.push(this.createChessPiece(26, ChessPieceType.PAWN, false, {x: 1, y: 6}));
    chessPieces.push(this.createChessPiece(27, ChessPieceType.PAWN, false, {x: 2, y: 6}));
    chessPieces.push(this.createChessPiece(28, ChessPieceType.PAWN, false, {x: 3, y: 6}));
    chessPieces.push(this.createChessPiece(29, ChessPieceType.PAWN, false, {x: 4, y: 6}));
    chessPieces.push(this.createChessPiece(30, ChessPieceType.PAWN, false, {x: 5, y: 6}));
    chessPieces.push(this.createChessPiece(31, ChessPieceType.PAWN, false, {x: 6, y: 6}));
    chessPieces.push(this.createChessPiece(32, ChessPieceType.PAWN, false, {x: 7, y: 6}));

    return new BehaviorSubject<ChessPiece[]>(chessPieces);
  }

  private createChessPiece(id: number, type: string, isBlack: boolean, coordinates): ChessPiece {
    const castlingLeftAllowed: boolean = (type === ChessPieceType.KING) || (type === ChessPieceType.ROOK && coordinates.x === 0);
    const castlingRightAllowed: boolean = (type === ChessPieceType.KING) || (type === ChessPieceType.ROOK && coordinates.x === 7);
    
    const chessPiece: ChessPiece = {
      id: id,
      type: type,
      isBlack: isBlack,
      isCheckMove: false,
      from: {x: coordinates.x, y: coordinates.y},
      to: {x: coordinates.x, y: coordinates.y},
      myTurn: false,
      enPassantStatus: EnPassantStatus.NOT_ALLOWED,
      castlingLeftStatus: castlingLeftAllowed ? CastlingStatus.ALLOWED : CastlingStatus.NOT_ALLOWED,
      castlingRightStatus: castlingRightAllowed ? CastlingStatus.ALLOWED : CastlingStatus.NOT_ALLOWED
    }; 

    return chessPiece;
  }

  public hasAChessPieceOfType(field: number, type: string): boolean {
    const chessPiece: ChessPiece = this.getChessPiece(field);

    return chessPiece && chessPiece.type === type ? true : false;
  }

}
