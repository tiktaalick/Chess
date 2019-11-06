export interface ChessPiece {
  id: number;
  type: string;
  isBlack: boolean; 
  from: Coordinates;
  to: Coordinates;
  myTurn: boolean;
  enPassantStatus: string;
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface Field {
  number: number;
  isValidMove: boolean;
}

