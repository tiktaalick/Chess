import { TILE_SIZE } from './../constants';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';

@Component({
  selector: 'app-knight',
  templateUrl: './knight.component.html',
  styleUrls: ['./knight.component.scss']
})
export class KnightComponent implements OnInit, OnDestroy {
  @Input() isBlack: boolean;
  
  constructor() { }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  getSource(): string {
    return this.isBlack ? "assets/images/black_knight.png" : "assets/images/white_knight.png";
  }

  getImageSize(): number {
    return TILE_SIZE;
  }
}
