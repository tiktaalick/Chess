import { TILE_SIZE } from './../constants';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-knight',
  templateUrl: './knight.component.html',
  styleUrls: ['./knight.component.scss']
})
export class KnightComponent {
  @Input() isBlack: boolean;
  
  constructor() { }

  public getSource(): string {
    return this.isBlack ? "assets/images/black_knight.png" : "assets/images/white_knight.png";
  }

  public getImageSize(): number {
    return TILE_SIZE;
  }
}
