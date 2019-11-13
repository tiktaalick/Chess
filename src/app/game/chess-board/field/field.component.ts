import { DarkerTile, LighterTile, ValidMove, CheckMove, PlayerHasLost } from '../../constants';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.scss']
})
export class FieldComponent {
  @Input() darkerTile: boolean;
  @Input() isValidMove: boolean;
  @Input() isCheckMove: boolean;
  @Input() playerHasLost: boolean;
  @Input() field: number;
  @Input() x: number;
  @Input() y: number;

  constructor() { }

  public getStyle() {
    let style = this.darkerTile
        ? { backgroundColor: "rgb("+DarkerTile.RED+","+DarkerTile.GREEN+","+DarkerTile.BLUE+")" }
        : { backgroundColor: "rgb("+LighterTile.RED+","+LighterTile.GREEN+","+LighterTile.BLUE+")" };

    if (this.playerHasLost) {
      style = { backgroundColor: "rgb("+PlayerHasLost.RED+","+PlayerHasLost.GREEN+","+PlayerHasLost.BLUE+")" };
    } else if (this.isValidMove) {
      style = { backgroundColor: "rgb("+ValidMove.RED+","+ValidMove.GREEN+","+ValidMove.BLUE+")" };
    } else if (this.isCheckMove) {
      style = { backgroundColor: "rgb("+CheckMove.RED+","+CheckMove.GREEN+","+CheckMove.BLUE+")" };
    }

    return style;
  }
}
