import { create } from 'zustand';
import { LocalScoreRepository } from '../repositories/localScoreRepository';
import { FirebaseScoreRepository, subscribeToGames } from '../repositories/firebaseScoreRepository';
import { ensureAuth } from '../lib/firebase';
import type {
  GameId,
  GameRecord,
  GameUpdate,
  NewGameInput,
  Pair,
  Player,
} from '../types';

export interface ScoreState {
  players: Player[];
  pairs: Pair[];
  games: GameRecord[];
  loading: boolean;
  initialized: boolean;
  error?: string;
  init: () => Promise<void>;
  addGame: (input: NewGameInput) => Promise<GameRecord>;
  updateGame: (id: GameId, update: GameUpdate) => Promise<GameRecord>;
  undoLastChange: (id: GameId) => Promise<GameRecord>;
  deleteGame: (id: GameId) => Promise<void>;
}

const useFirebase = import.meta.env.VITE_USE_FIREBASE === 'true';
const repository = useFirebase ? new FirebaseScoreRepository() : new LocalScoreRepository();

let unsubscribeGames: (() => void) | undefined;

export const useScoreStore = create<ScoreState>((set, get) => ({
  players: [],
  pairs: [],
  games: [],
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

      const [players, pairs, games] = await Promise.all([
        repository.listPlayers(),
        repository.listPairs(),
        repository.listGames(),
      ]);

      if (useFirebase && !unsubscribeGames) {
        unsubscribeGames = subscribeToGames(
          (records) => {
            set({ games: records });
          },
          (error) => {
            set({ error: error.message });
          },
        );
      }
      set({
        players,
        pairs,
        games,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },
  addGame: async (input) => {
    set({ loading: true, error: undefined });
    try {
      const created = await repository.addGame(input);
      const games = [...get().games, created];
      set({ games, loading: false });
      return created;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  updateGame: async (id, update) => {
    set({ loading: true, error: undefined });
    try {
      const updated = await repository.updateGame(id, update);
      const games = get().games.map((game) => (game.id === id ? updated : game));
      set({ games, loading: false });
      return updated;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  undoLastChange: async (id) => {
    set({ loading: true, error: undefined });
    try {
      const reverted = await repository.undoLastChange(id);
      const games = get().games.map((game) => (game.id === id ? reverted : game));
      set({ games, loading: false });
      return reverted;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
  deleteGame: async (id) => {
    set({ loading: true, error: undefined });
    try {
      await repository.deleteGame(id);
      const games = get().games.filter((game) => game.id !== id);
      set({ games, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
}));
