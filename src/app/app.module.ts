import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { FieldComponent } from './game/chess-board/field/field.component';
import { ChessPieceComponent } from './game/chess-piece/chess-piece.component';
import { ChessBoardComponent } from './game/chess-board/chess-board.component';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
@NgModule({
  declarations: [
    AppComponent,
    ChessPieceComponent,
    FieldComponent,
    ChessBoardComponent,
    GameComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    DragDropModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
