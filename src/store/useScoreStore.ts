import { create } from 'zustand';
import { LocalScoreRepository } from '../repositories/localScoreRepository';
import { FirebaseScoreRepository, subscribeToGames } from '../repositories/firebaseScoreRepository';
import { ensureAuth } from '../lib/firebase';
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

const useFirebase = import.meta.env.VITE_USE_FIREBASE === 'true';
const repository = useFirebase ? new FirebaseScoreRepository() : new LocalScoreRepository();

let unsubscribeGames: (() => void) | undefined;

// Migration logic
async function migrateToMultiGroup() {
  console.log('Checking if migration is needed...');
  
  const migrationKey = 'burako_migration_completed';
  const migrated = localStorage.getItem(migrationKey);
  
  if (migrated === 'true') {
    console.log('Already migrated, skipping...');
    return;
  }
  
  console.log('Starting migration to multi-group support...');
  
  try {
    // Check if groups already exist
    const existingGroups = await repository.listGroups();
    if (existingGroups.length > 0) {
      console.log('Groups already exist, marking as migrated');
      localStorage.setItem(migrationKey, 'true');
      return;
    }
    
    // Backup existing data
    const backup = {
      timestamp: new Date().toISOString(),
      players: await repository.legacyListPlayers?.() || [],
      pairs: await repository.legacyListPairs?.() || [],
      games: await repository.legacyListGames?.() || [],
    };
    
    localStorage.setItem('burako_pre_migration_backup', JSON.stringify(backup));
    console.log(`Backed up ${backup.games.length} games, ${backup.players.length} players, ${backup.pairs.length} pairs`);
    
    if (backup.games.length === 0 && backup.players.length === 0) {
      console.log('No existing data to migrate');
      localStorage.setItem(migrationKey, 'true');
      return;
    }
    
    // Create default group
    const defaultGroup = await repository.createGroup('Maayan, Nevo, Assaf & Gilad');
    console.log(`Created default group: ${defaultGroup.id}`);
    
    // Add players to group
    for (const player of backup.players) {
      await repository.addPlayerToGroup(defaultGroup.id, player.id);
      console.log(`Added ${player.name} to default group`);
    }
    
    // Create pairs in the group
    for (const pair of backup.pairs) {
      await repository.createPair(defaultGroup.id, pair.players);
      console.log(`Created pair in group: ${pair.id}`);
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
      console.log(`Migrated game: ${game.id} (${game.playedAt})`);
    }
    
    console.log(`✅ Migration complete! Migrated ${backup.games.length} games`);
    
    // Mark migration as complete
    localStorage.setItem(migrationKey, 'true');
    localStorage.setItem('burako_active_group_id', defaultGroup.id);
    
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
      if (useFirebase) {
        await ensureAuth();
      }
      
      // Run migration if needed
      await migrateToMultiGroup();
      
      // Load groups
      const groups = await repository.listGroups();
      console.log('Loaded groups:', groups);
      console.log('Number of groups:', groups.length);
      
      // Get or set active group
      let activeGroupId = localStorage.getItem('burako_active_group_id');
      console.log('Active group ID from localStorage:', activeGroupId);
      
      if (!activeGroupId && groups.length > 0) {
        activeGroupId = groups[0].id;
        console.log('Setting first group as active:', activeGroupId);
        localStorage.setItem('burako_active_group_id', activeGroupId);
      }
      
      if (!activeGroupId) {
        // No groups yet - show onboarding
        console.log('No active group, showing onboarding');
        set({ groups, loading: false, initialized: true });
        return;
      }
      
      console.log('Loading data for group:', activeGroupId);
      
      // Load active group data
      const [players, pairs, games, allPlayers] = await Promise.all([
        repository.listGroupMembers(activeGroupId),
        repository.listPairs(activeGroupId),
        repository.listGames(activeGroupId),
        repository.listAllPlayers(),
      ]);
      
      // Subscribe to changes
      if (useFirebase && !unsubscribeGames) {
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
      if (useFirebase) {
        unsubscribeGames = subscribeToGames(
          groupId,
          (records) => set({ games: records }),
          (error) => set({ error: error.message }),
        );
      }
      
      // Save active group
      localStorage.setItem('burako_active_group_id', groupId);
      
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
      if (useFirebase) {
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
      if (useFirebase) {
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
      if (useFirebase) {
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
      if (useFirebase) {
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
