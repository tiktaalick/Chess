import { GameService } from './../services/game.service';
import { Component, OnInit } from '@angular/core';
import { Coordinates } from '../interfaces/coordinates';
import { CdkDragDrop, moveItemInArray, CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  knightPosition$ = this.game.knightPosition$;
  fields: number[] = new Array(64).fill(0).map((_,i) => i);
  dragPosition = {x: 0, y: 0};
  coordinates(i): Coordinates {
    return {
      x: i % 8,
      y: Math.floor(i / 8)
    }
  }
  
constructor(private game: GameService) { }  

  ngOnInit() {

    }

  isBlack({ x, y }: Coordinates) {
      return (x + y) % 2 === 1;
  }

onDrop(event: CdkDragDrop<number[]>, pos: Coordinates, i: number) {
  //debugger;
  this.game.moveKnight(this.coordinates(event.currentIndex));
  //moveItemInArray(this.fields, event.previousIndex, event.currentIndex + 2);
    // if (this.game.canMoveKnight(pos)) {
    //     this.game.moveKnight(pos);
    // }
//    console.log(CdkDrag.);

  }

onDragEnded(event) {
  //debugger;
  let element = event.source.getRootElement();
  let boundingClientRect = element.getBoundingClientRect();
  let newPosition: Coordinates = ({ x: Math.floor(boundingClientRect.x / 70), y: Math.floor(boundingClientRect.y / 70) });
  if (this.game.canMoveKnight(newPosition)) {
      this.game.moveKnight(newPosition);
  }

  this.dragPosition = this.getPosition(element);
  
}

getPosition(el) {
  let x = 0;
  let y = 0;
  while(el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
    x += el.offsetLeft - el.scrollLeft;
    y += el.offsetTop - el.scrollTop;
    el = el.offsetParent;
  }
  return { x: x, y: y };
}

// onDrop(event: CdkDragDrop<number[]>, pos: Coordinates, i: number) {
//       moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
//     } else {
//       transferArrayItem(event.previousContainer.data,
//                         event.container.data,
//                         event.previousIndex,
//                         event.currentIndex);
//     }
//   }
 }
