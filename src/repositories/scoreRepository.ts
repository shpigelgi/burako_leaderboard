import type { GameId, GameRecord, GameUpdate, Group, GroupId, NewGameInput, Pair, Player } from '../types';

export interface ScoreRepository {
  // Group management
  listGroups(): Promise<Group[]>;
  createGroup(name: string): Promise<Group>;
  updateGroup(groupId: GroupId, name: string): Promise<Group>;
  deleteGroup(groupId: GroupId): Promise<void>;
  
  // Player management (global)
  listAllPlayers(): Promise<Player[]>;
  createPlayer(name: string): Promise<Player>;
  updatePlayer(playerId: string, name: string): Promise<Player>;
  deletePlayer(playerId: string): Promise<void>;
  
  // Group membership
  listGroupMembers(groupId: GroupId): Promise<Player[]>;
  addPlayerToGroup(groupId: GroupId, playerId: string): Promise<void>;
  removePlayerFromGroup(groupId: GroupId, playerId: string): Promise<void>;
  
  // Pairs (group-scoped)
  listPairs(groupId: GroupId): Promise<Pair[]>;
  createPair(groupId: GroupId, players: [string, string]): Promise<Pair>;
  
  // Games (group-scoped)
  listGames(groupId: GroupId): Promise<GameRecord[]>;
  addGame(groupId: GroupId, input: NewGameInput): Promise<GameRecord>;
  updateGame(groupId: GroupId, id: GameId, update: GameUpdate): Promise<GameRecord>;
  undoLastChange(groupId: GroupId, id: GameId): Promise<GameRecord>;
  deleteGame(groupId: GroupId, id: GameId): Promise<void>;
  
  // Legacy methods for migration
  legacyListPlayers?(): Promise<Player[]>;
  legacyListPairs?(): Promise<Pair[]>;
  legacyListGames?(): Promise<GameRecord[]>;
}
