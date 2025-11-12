import { LocalScoreRepository } from './localScoreRepository';
import { FirebaseScoreRepository } from './firebaseScoreRepository';
import type { ScoreRepository } from './scoreRepository';

/**
 * Singleton factory for repository instances.
 * Ensures only one repository instance exists throughout the application lifecycle.
 */
class RepositoryFactory {
  private static instance: ScoreRepository | null = null;
  private static useFirebase: boolean | null = null;

  /**
   * Get the singleton repository instance.
   * Creates it on first call, returns cached instance on subsequent calls.
   */
  static getRepository(): ScoreRepository {
    const shouldUseFirebase = import.meta.env.VITE_USE_FIREBASE === 'true';

    // If environment changed, reset instance (mainly for testing)
    if (this.useFirebase !== null && this.useFirebase !== shouldUseFirebase) {
      this.instance = null;
    }

    if (!this.instance) {
      this.useFirebase = shouldUseFirebase;
      this.instance = shouldUseFirebase
        ? new FirebaseScoreRepository()
        : new LocalScoreRepository();
    }

    return this.instance;
  }

  /**
   * Check if using Firebase repository.
   */
  static isUsingFirebase(): boolean {
    return this.useFirebase === true;
  }

  /**
   * Reset the singleton instance (for testing purposes only).
   */
  static reset(): void {
    this.instance = null;
    this.useFirebase = null;
  }
}

export default RepositoryFactory;
