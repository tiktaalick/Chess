import { DarkerTile, LighterTile } from '../../constants';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-square',
  templateUrl: './square.component.html',
  styleUrls: ['./square.component.scss']
})
export class SquareComponent {
  @Input() darkerTile: boolean;
  @Input() isValidMove: boolean;
  @Input() field: number;
  @Input() x: number;
  @Input() y: number;

  constructor() { }

  public getStyle() {
    const standard = this.darkerTile
        ? { backgroundColor: "rgb("+DarkerTile.RED+","+DarkerTile.GREEN+","+DarkerTile.BLUE+")" }
        : { backgroundColor: "rgb("+LighterTile.RED+","+LighterTile.GREEN+","+LighterTile.BLUE+")" };

    const style = this.isValidMove
        ? { backgroundColor: "rgb("+DarkerTile.RED+",255,"+DarkerTile.BLUE+")" }
        : standard;

    return style;
  }
}
