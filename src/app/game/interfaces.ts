import { TurnPhase } from './constants';
export interface ChessPiece {
  id: number;
  type: string;
  isBlack: boolean; 
  isUnderAttack: boolean;
  from: Coordinates;
  to: Coordinates;
  myTurn: boolean;
  enPassantStatus: string;
  castlingLeftStatus: string;
  castlingRightStatus: string;
}

export interface ChessBoard {
  turnPhase: string;
  chessPieces: ChessPiece[]
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface Field {
  number: number;
  isValidMove: boolean;
  isCheckMove: boolean;
}

