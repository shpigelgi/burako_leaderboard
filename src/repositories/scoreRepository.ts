import type { GameId, GameRecord, GameUpdate, NewGameInput, Pair, Player } from '../types';

export interface ScoreRepository {
  listPlayers(): Promise<Player[]>;
  listPairs(): Promise<Pair[]>;
  listGames(): Promise<GameRecord[]>;
  addGame(input: NewGameInput): Promise<GameRecord>;
  updateGame(id: GameId, update: GameUpdate): Promise<GameRecord>;
  undoLastChange(id: GameId): Promise<GameRecord>;
  deleteGame(id: GameId): Promise<void>;
}
