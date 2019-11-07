import { DarkerTile, LighterTile, ValidMove, CheckMove } from '../../constants';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-square',
  templateUrl: './square.component.html',
  styleUrls: ['./square.component.scss']
})
export class SquareComponent {
  @Input() darkerTile: boolean;
  @Input() isValidMove: boolean;
  @Input() isCheckMove: boolean;
  @Input() field: number;
  @Input() x: number;
  @Input() y: number;

  constructor() { }

  public getStyle() {
    let style = this.darkerTile
        ? { backgroundColor: "rgb("+DarkerTile.RED+","+DarkerTile.GREEN+","+DarkerTile.BLUE+")" }
        : { backgroundColor: "rgb("+LighterTile.RED+","+LighterTile.GREEN+","+LighterTile.BLUE+")" };

    if (this.isValidMove) {
      style = { backgroundColor: "rgb("+ValidMove.RED+","+ValidMove.GREEN+","+ValidMove.BLUE+")" };
    } else if (this.isCheckMove) {
      style = { backgroundColor: "rgb("+CheckMove.RED+","+CheckMove.GREEN+","+CheckMove.BLUE+")" };
    }

    return style;
  }
}
