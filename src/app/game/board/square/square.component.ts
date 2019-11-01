import { DarkerTile, LighterTile } from '../../constants';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-square',
  templateUrl: './square.component.html',
  styleUrls: ['./square.component.scss']
})
export class SquareComponent implements OnInit {
  @Input() darkerTile: boolean;

  constructor() { }

  ngOnInit() {
  }

  getStyle() {
    return this.darkerTile
        ? { backgroundColor: "rgb("+DarkerTile.RED+","+DarkerTile.GREEN+","+DarkerTile.BLUE+")" }
        : { backgroundColor: "rgb("+LighterTile.RED+","+LighterTile.GREEN+","+LighterTile.BLUE+")" }
  }
}
