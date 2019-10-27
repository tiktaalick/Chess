import { Coordinates } from '../interfaces/coordinates';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  knightPosition$ = new BehaviorSubject<Coordinates>({ x: 1, y: 0 });
  currentPosition: Coordinates;

    constructor() {
        this.knightPosition$.subscribe(kp => {
            this.currentPosition = kp;
        })
    }

    moveKnight(to: Coordinates) {
        this.knightPosition$.next(to);
    }

canMoveKnight(to: Coordinates) {
        const { x, y } = this.currentPosition;
        const dx = to.x - x;
        const dy = to.y - y;

        return (Math.abs(dx) === 2 && Math.abs(dy) === 1) ||
               (Math.abs(dx) === 1 && Math.abs(dy) === 2);
    }  
  }
