import { MoveService } from './game/services/move.service';
import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { BoardComponent } from './game/board/board.component';
import { SquareComponent } from './game/board/square/square.component';
import { ChessPieceComponent } from './game/chess.piece/chess.piece.component';
import { GameService } from './game/services/game.service';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
@NgModule({
  declarations: [
    AppComponent,
    ChessPieceComponent,
    SquareComponent,
    BoardComponent,
    GameComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    DragDropModule
  ],
  providers: [GameService, MoveService],
  bootstrap: [AppComponent]
})
export class AppModule { }
