import { ChessPiece, ChessBoard, Coordinates } from '../interfaces';
import { ChessPieceType, EnPassantStatus, CastlingStatus, TurnPhase } from './../constants';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class GameService implements OnDestroy {
  public chessBoard$: BehaviorSubject<ChessBoard> = this.initializeChessBoard$();
  public chessBoard: ChessBoard;
  public coordinates(i: number): Coordinates {
    return {
      x: i % 8,
      y: Math.floor(i / 8)
    }
  }
  public field(x: number, y: number): number {
    return x + 8 * y;
  }
  
  constructor() {
    this.chessBoard$.subscribe(chessPieces => {
      this.chessBoard = chessPieces;
    })

  }

  ngOnDestroy(): void {
    this.chessBoard$.unsubscribe();
  }

  public getChessPiece(chessBoard: ChessBoard, field: number): ChessPiece {
    const fieldX = this.coordinates(field).x;
    const fieldY = this.coordinates(field).y;

    return chessBoard.chessPieces.find(
      chessPiece => chessPiece.from.x === fieldX && chessPiece.from.y === fieldY);    
  }

  private initializeChessBoard$(): BehaviorSubject<ChessBoard> {
    let chessBoard: ChessBoard = {
      turnPhase: TurnPhase.PLAYER_SWITCH,
      chessPieces: []
    };    
    
    chessBoard.chessPieces.push(this.createChessPiece(1, ChessPieceType.ROOK, true, {x: 0, y: 0}));
    chessBoard.chessPieces.push(this.createChessPiece(2, ChessPieceType.KNIGHT, true, {x: 1, y: 0}));
    chessBoard.chessPieces.push(this.createChessPiece(3, ChessPieceType.BISHOP, true, {x: 2, y: 0}));
    chessBoard.chessPieces.push(this.createChessPiece(4, ChessPieceType.QUEEN, true, {x: 3, y: 0}));
    chessBoard.chessPieces.push(this.createChessPiece(5, ChessPieceType.KING, true, {x: 4, y: 0}));
    chessBoard.chessPieces.push(this.createChessPiece(6, ChessPieceType.BISHOP, true, {x: 5, y: 0}));
    chessBoard.chessPieces.push(this.createChessPiece(7, ChessPieceType.KNIGHT, true, {x: 6, y: 0}));
    chessBoard.chessPieces.push(this.createChessPiece(8, ChessPieceType.ROOK, true, {x: 7, y: 0}));
    chessBoard.chessPieces.push(this.createChessPiece(9, ChessPieceType.PAWN, true, {x: 0, y: 1}));
    chessBoard.chessPieces.push(this.createChessPiece(10, ChessPieceType.PAWN, true, {x: 1, y: 1}));
    chessBoard.chessPieces.push(this.createChessPiece(11, ChessPieceType.PAWN, true, {x: 2, y: 1}));
    chessBoard.chessPieces.push(this.createChessPiece(12, ChessPieceType.PAWN, true, {x: 3, y: 1}));
    chessBoard.chessPieces.push(this.createChessPiece(13, ChessPieceType.PAWN, true, {x: 4, y: 1}));
    chessBoard.chessPieces.push(this.createChessPiece(14, ChessPieceType.PAWN, true, {x: 5, y: 1}));
    chessBoard.chessPieces.push(this.createChessPiece(15, ChessPieceType.PAWN, true, {x: 6, y: 1}));
    chessBoard.chessPieces.push(this.createChessPiece(16, ChessPieceType.PAWN, true, {x: 7, y: 1}));
    
    chessBoard.chessPieces.push(this.createChessPiece(17, ChessPieceType.ROOK, false, {x: 0, y: 7}));
    chessBoard.chessPieces.push(this.createChessPiece(18, ChessPieceType.KNIGHT, false, {x: 1, y: 7}));
    chessBoard.chessPieces.push(this.createChessPiece(19, ChessPieceType.BISHOP, false, {x: 2, y: 7}));
    chessBoard.chessPieces.push(this.createChessPiece(20, ChessPieceType.QUEEN, false, {x: 3, y: 7}));
    chessBoard.chessPieces.push(this.createChessPiece(21, ChessPieceType.KING, false, {x: 4, y: 7}));
    chessBoard.chessPieces.push(this.createChessPiece(22, ChessPieceType.BISHOP, false, {x: 5, y: 7}));
    chessBoard.chessPieces.push(this.createChessPiece(23, ChessPieceType.KNIGHT, false, {x: 6, y: 7}));
    chessBoard.chessPieces.push(this.createChessPiece(24, ChessPieceType.ROOK, false, {x: 7, y: 7}));
    chessBoard.chessPieces.push(this.createChessPiece(25, ChessPieceType.PAWN, false, {x: 0, y: 6}));
    chessBoard.chessPieces.push(this.createChessPiece(26, ChessPieceType.PAWN, false, {x: 1, y: 6}));
    chessBoard.chessPieces.push(this.createChessPiece(27, ChessPieceType.PAWN, false, {x: 2, y: 6}));
    chessBoard.chessPieces.push(this.createChessPiece(28, ChessPieceType.PAWN, false, {x: 3, y: 6}));
    chessBoard.chessPieces.push(this.createChessPiece(29, ChessPieceType.PAWN, false, {x: 4, y: 6}));
    chessBoard.chessPieces.push(this.createChessPiece(30, ChessPieceType.PAWN, false, {x: 5, y: 6}));
    chessBoard.chessPieces.push(this.createChessPiece(31, ChessPieceType.PAWN, false, {x: 6, y: 6}));
    chessBoard.chessPieces.push(this.createChessPiece(32, ChessPieceType.PAWN, false, {x: 7, y: 6}));

    return new BehaviorSubject<ChessBoard>(chessBoard);
  }

  private createChessPiece(id: number, type: string, isBlack: boolean, coordinates): ChessPiece {
    const castlingLeftAllowed: boolean = (type === ChessPieceType.KING) || (type === ChessPieceType.ROOK && coordinates.x === 0);
    const castlingRightAllowed: boolean = (type === ChessPieceType.KING) || (type === ChessPieceType.ROOK && coordinates.x === 7);
    
    const chessPiece: ChessPiece = {
      id: id,
      type: type,
      isBlack: isBlack,
      isUnderAttack: false,
      from: {x: coordinates.x, y: coordinates.y},
      to: {x: coordinates.x, y: coordinates.y},
      myTurn: false,
      enPassantStatus: EnPassantStatus.NOT_ALLOWED,
      castlingLeftStatus: castlingLeftAllowed ? CastlingStatus.ALLOWED : CastlingStatus.NOT_ALLOWED,
      castlingRightStatus: castlingRightAllowed ? CastlingStatus.ALLOWED : CastlingStatus.NOT_ALLOWED
    }; 

    return chessPiece;
  }

  public hasAChessPieceOfType(chessBoard: ChessBoard, field: number, type: string): boolean {
    const chessPiece: ChessPiece = this.getChessPiece(chessBoard, field);

    return chessPiece && chessPiece.type === type ? true : false;
  }

  public cloneChessBoard(chessBoard: ChessBoard, turnPhase: string): ChessBoard {
    chessBoard = _.cloneDeep(chessBoard);
    chessBoard.turnPhase = turnPhase; 

    return chessBoard;
  }

}
