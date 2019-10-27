import { SkyhookDndService } from '@angular-skyhook/core';
import { AppComponent } from './app.component';
import { ContainerComponent } from './container/container.component';
import { BoardComponent } from './container/board/board.component';
import { SquareComponent } from './container/board/square/square.component';
import { KnightComponent } from './container/knight/knight.component';
import { GameService } from './container/services/game.service';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
@NgModule({
  declarations: [
    AppComponent,
    KnightComponent,
    SquareComponent,
    BoardComponent,
    ContainerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    DragDropModule
  ],
  providers: [GameService],
  bootstrap: [AppComponent]
})
export class AppModule { }
