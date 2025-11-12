import { create } from 'zustand';
import RepositoryFactory from '../repositories/repositoryFactory';
import { subscribeToGames } from '../repositories/firebaseScoreRepository';
import { ensureAuth } from '../lib/firebase';
import { STORAGE_KEYS, DEFAULTS } from '../lib/constants';
import type {
  GameId,
  GameRecord,
  GameUpdate,
  Group,
  GroupId,
  NewGameInput,
  Pair,
  Player,
} from '../types';

export interface ScoreState {
  // Groups
  groups: Group[];
  activeGroupId: GroupId | null;
  
  // Active group data
  players: Player[];
  pairs: Pair[];
  games: GameRecord[];
  
  // Global players
  allPlayers: Player[];
  
  loading: boolean;
  initialized: boolean;
  error?: string;
  
  // Initialization and migration
  init: () => Promise<void>;
  
  // Group actions
  loadGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<Group>;
  updateGroup: (groupId: GroupId, name: string) => Promise<Group>;
  switchGroup: (groupId: GroupId) => Promise<void>;
  deleteGroup: (groupId: GroupId) => Promise<void>;
  
  // Player actions
  loadAllPlayers: () => Promise<void>;
  createPlayer: (name: string) => Promise<Player>;
  updatePlayer: (playerId: string, name: string) => Promise<Player>;
  deletePlayer: (playerId: string) => Promise<void>;
  addPlayerToGroup: (playerId: string) => Promise<void>;
  removePlayerFromGroup: (playerId: string) => Promise<void>;
  
  // Pair actions
  createPair: (players: [string, string]) => Promise<Pair>;
  
  // Game actions (use activeGroupId internally)
  addGame: (input: NewGameInput) => Promise<GameRecord>;
  updateGame: (id: GameId, update: GameUpdate) => Promise<GameRecord>;
  undoLastChange: (id: GameId) => Promise<GameRecord>;
  deleteGame: (id: GameId) => Promise<void>;
}

// Get singleton repository instance
const repository = RepositoryFactory.getRepository();

let unsubscribeGames: (() => void) | undefined;

// Migration logic
async function migrateToMultiGroup() {
  const migrated = localStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETED);
  
  if (migrated === 'true') {
    return;
  }
  
  try {
    // Check if groups already exist
    const existingGroups = await repository.listGroups();
    if (existingGroups.length > 0) {
      localStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETED, 'true');
      return;
    }
    
    // Backup existing data
    const backup = {
      timestamp: new Date().toISOString(),
      players: await repository.legacyListPlayers?.() || [],
      pairs: await repository.legacyListPairs?.() || [],
      games: await repository.legacyListGames?.() || [],
    };
    
    localStorage.setItem(STORAGE_KEYS.PRE_MIGRATION_BACKUP, JSON.stringify(backup));
    
    if (backup.games.length === 0 && backup.players.length === 0) {
      localStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETED, 'true');
      return;
    }
    
    // Create default group
    const defaultGroup = await repository.createGroup(DEFAULTS.GROUP_NAME);
    
    // Add players to group
    for (const player of backup.players) {
      await repository.addPlayerToGroup(defaultGroup.id, player.id);
    }
    
    // Create pairs in the group
    for (const pair of backup.pairs) {
      await repository.createPair(defaultGroup.id, pair.players);
    }
    
    // Migrate games
    for (const game of backup.games) {
      await repository.addGame(defaultGroup.id, {
        playedAt: game.playedAt,
        teams: game.teams,
        scores: game.scores,
        notes: game.notes,
        startingPairId: game.startingPairId,
      });
    }
    
    // Mark migration as complete
    localStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETED, 'true');
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP_ID, defaultGroup.id);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw new Error(`Migration failed: ${(error as Error).message}`);
  }
}

export const useScoreStore = create<ScoreState>((set, get) => ({
  groups: [],
  activeGroupId: null,
  players: [],
  pairs: [],
  games: [],
  allPlayers: [],
  loading: false,
  initialized: false,
  error: undefined,
  
  init: async () => {
    if (get().initialized || get().loading) {
      return;
    }
    set({ loading: true, error: undefined });
    
    try {
      if (RepositoryFactory.isUsingFirebase()) {
        await ensureAuth();
      }
      
      // Run migration if needed
      await migrateToMultiGroup();
      
      // Load groups
      const groups = await repository.listGroups();
      
      // Get or set active group
      let activeGroupId = localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP_ID);
      
      if (!activeGroupId && groups.length > 0) {
        activeGroupId = groups[0].id;
        localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP_ID, activeGroupId);
      }
      
      if (!activeGroupId) {
        // No groups yet - show onboarding
        set({ groups, loading: false, initialized: true });
        return;
      }
      
      // Load active group data
      const [players, pairs, games, allPlayers] = await Promise.all([
        repository.listGroupMembers(activeGroupId),
        repository.listPairs(activeGroupId),
        repository.listGames(activeGroupId),
        repository.listAllPlayers(),
      ]);
      
      // Subscribe to changes
      if (RepositoryFactory.isUsingFirebase() && !unsubscribeGames) {
        unsubscribeGames = subscribeToGames(
          activeGroupId,
          (records) => set({ games: records }),
          (error) => set({ error: error.message }),
        );
      }
      
      set({
        groups,
        activeGroupId,
        players,
        pairs,
        games,
        allPlayers,
        loading: false,
        initialized: true,
      });
      
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  
  loadGroups: async () => {
    set({ loading: true, error: undefined });
    try {
      const groups = await repository.listGroups();
      set({ groups, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  
  createGroup: async (name: string) => {
    set({ loading: true, error: undefined });
    try {
      const group = await repository.createGroup(name);
      const groups = [...get().groups, group];
      set({ groups, loading: false });
      return group;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  
  updateGroup: async (groupId: GroupId, name: string) => {
    set({ loading: true, error: undefined });
    try {
      const group = await repository.updateGroup(groupId, name);
      const groups = get().groups.map((g) => (g.id === groupId ? group : g));
      set({ groups, loading: false });
      return group;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  
  switchGroup: async (groupId: GroupId) => {
    set({ loading: true, error: undefined });
    try {
      // Unsubscribe from current group
      if (unsubscribeGames) {
        unsubscribeGames();
        unsubscribeGames = undefined;
      }
      
      // Load new group data
      const [players, pairs, games] = await Promise.all([
        repository.listGroupMembers(groupId),
        repository.listPairs(groupId),
        repository.listGames(groupId),
      ]);
      
      // Subscribe to new group
      if (RepositoryFactory.isUsingFirebase()) {
        unsubscribeGames = subscribeToGames(
          groupId,
          (records) => set({ games: records }),
          (error) => set({ error: error.message }),
        );
      }
      
      // Save active group
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP_ID, groupId);
      
      set({
        activeGroupId: groupId,
        players,
        pairs,
        games,
        loading: false,
      });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  
  deleteGroup: async (groupId: GroupId) => {
    set({ loading: true, error: undefined });
    try {
      await repository.deleteGroup(groupId);
      const groups = get().groups.filter((g) => g.id !== groupId);
      
      // If deleting active group, switch to another or clear
      if (get().activeGroupId === groupId) {
        if (groups.length > 0) {
          await get().switchGroup(groups[0].id);
        } else {
          set({
            activeGroupId: null,
            players: [],
            pairs: [],
            games: [],
          });
          localStorage.removeItem('burako_active_group_id');
        }
      }
      
      set({ groups, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  
  loadAllPlayers: async () => {
    set({ loading: true, error: undefined });
    try {
      const allPlayers = await repository.listAllPlayers();
      set({ allPlayers, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  
  createPlayer: async (name: string) => {
    set({ loading: true, error: undefined });
    try {
      const player = await repository.createPlayer(name);
      const allPlayers = [...get().allPlayers, player];
      set({ allPlayers, loading: false });
      return player;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  
  updatePlayer: async (playerId: string, name: string) => {
    set({ loading: true, error: undefined });
    try {
      const player = await repository.updatePlayer(playerId, name);
      const allPlayers = get().allPlayers.map((p) => (p.id === playerId ? player : p));
      set({ allPlayers, loading: false });
      return player;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  
  deletePlayer: async (playerId: string) => {
    set({ loading: true, error: undefined });
    try {
      await repository.deletePlayer(playerId);
      const allPlayers = get().allPlayers.filter((p) => p.id !== playerId);
      set({ allPlayers, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  
  addPlayerToGroup: async (playerId: string) => {
    const { activeGroupId } = get();
    if (!activeGroupId) {
      throw new Error('No active group');
    }
    set({ loading: true, error: undefined });
    try {
      await repository.addPlayerToGroup(activeGroupId, playerId);
      const players = await repository.listGroupMembers(activeGroupId);
      set({ players, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  
  removePlayerFromGroup: async (playerId: string) => {
    const { activeGroupId } = get();
    if (!activeGroupId) {
      throw new Error('No active group');
    }
    set({ loading: true, error: undefined });
    try {
      await repository.removePlayerFromGroup(activeGroupId, playerId);
      const players = await repository.listGroupMembers(activeGroupId);
      set({ players, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  
  createPair: async (players: [string, string]) => {
    const { activeGroupId } = get();
    if (!activeGroupId) {
      throw new Error('No active group');
    }
    set({ loading: true, error: undefined });
    try {
      const pair = await repository.createPair(activeGroupId, players);
      const pairs = await repository.listPairs(activeGroupId);
      set({ pairs, loading: false });
      return pair;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  
  addGame: async (input) => {
    const { activeGroupId } = get();
    if (!activeGroupId) {
      throw new Error('No active group');
    }
    set({ loading: true, error: undefined });
    try {
      const created = await repository.addGame(activeGroupId, input);
      if (RepositoryFactory.isUsingFirebase()) {
        set({ loading: false });
      } else {
        const games = [...get().games, created];
        set({ games, loading: false });
      }
      return created;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  
  updateGame: async (id, update) => {
    const { activeGroupId } = get();
    if (!activeGroupId) {
      throw new Error('No active group');
    }
    set({ loading: true, error: undefined });
    try {
      const updated = await repository.updateGame(activeGroupId, id, update);
      if (RepositoryFactory.isUsingFirebase()) {
        set({ loading: false });
      } else {
        const games = get().games.map((game) => (game.id === id ? updated : game));
        set({ games, loading: false });
      }
      return updated;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  
  undoLastChange: async (id) => {
    const { activeGroupId } = get();
    if (!activeGroupId) {
      throw new Error('No active group');
    }
    set({ loading: true, error: undefined });
    try {
      const reverted = await repository.undoLastChange(activeGroupId, id);
      if (RepositoryFactory.isUsingFirebase()) {
        set({ loading: false });
      } else {
        const games = get().games.map((game) => (game.id === id ? reverted : game));
        set({ games, loading: false });
      }
      return reverted;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  
  deleteGame: async (id) => {
    const { activeGroupId } = get();
    if (!activeGroupId) {
      throw new Error('No active group');
    }
    set({ loading: true, error: undefined });
    try {
      await repository.deleteGame(activeGroupId, id);
      if (RepositoryFactory.isUsingFirebase()) {
        set({ loading: false });
      } else {
        const games = get().games.filter((game) => game.id !== id);
        set({ games, loading: false });
      }
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
}));
