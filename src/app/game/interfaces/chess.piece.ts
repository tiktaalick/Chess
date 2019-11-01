import { Coordinates } from './../../game/interfaces/coordinates';
export interface ChessPiece {
  id: number;
  type: string;
  isBlack: boolean; 
  coordinates: Coordinates;
}
