export const ChessPieceType = {
    KING: 'king',
    QUEEN: 'queen',
    ROOK: 'rook',
    BISHOP: 'bishop',
    KNIGHT: 'knight',
    PAWN: 'pawn'
}

export const DarkerTile = {
    RED: 140,
    GREEN: 80,
    BLUE: 0
}

export const LighterTile = {
    RED: 240,
    GREEN: 240,
    BLUE: 180
}

export const ValidMove = {
    RED: 140,
    GREEN: 255,
    BLUE: 0
}

export const CheckMove = {
    RED: 255,
    GREEN: 100,
    BLUE: 0
}

export const EnPassantStatus = {
    ALLOWED: 'allowed',
    NOT_ALLOWED: 'not allowed',
    ABOUT_TO_BE_KICKED_OFF: 'about to be kicked off'
}

export const CastlingStatus = {
    ALLOWED: 'allowed',
    NOT_ALLOWED: 'not allowed',
    ABOUT_TO_CASTLE: 'about to castle'
}

export const TurnPhase = {
    PLAYER_SWITCH: 'There is a new active player.',
    PLAYER_DRAG: 'The active player drags a piece.',
    PLAYER_DRAG_ENDED: 'The active player has ended dragging a piece.',
    PLAYER_MOVE: 'The active player makes a move.',
    PLAYER_CASTLE: 'The active player castles.',
    PLAYER_CHECK: 'Checking if the active player has put himself in check.',
    OTHER_CHECK: 'Checking if the other player has been put in check.',
    OTHER_MOVES: 'Checking if the other player is still able to make a move.'    
}

export const TILE_SIZE = 70;

