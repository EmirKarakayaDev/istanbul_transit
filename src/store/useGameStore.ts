import { create } from 'zustand';
import type { GameMode, GameState, ScenarioTarget } from '../data/types';
import { BUDGET_MODE_START } from '../data/constants';

interface GameActions {
  setMode: (mode: GameMode) => void;
  deductCost: (amount: number) => boolean; // returns false if insufficient budget
  addCost: (amount: number) => void; // refund on demolish
  setScenario: (scenario: ScenarioTarget) => void;
  updateScore: (score: number) => void;
  resetGame: () => void;
  loadGame: (state: GameState) => void;
}

interface GameStore extends GameState, GameActions {}

const defaultState = (): GameState => ({
  mode: 'sandbox',
  budget: Infinity,
  spent: 0,
  score: 0,
  scenario: null,
});

export const useGameStore = create<GameStore>((set, get) => ({
  ...defaultState(),

  setMode: (mode) => {
    const budget = mode === 'budget' ? BUDGET_MODE_START : Infinity;
    set({ mode, budget, spent: 0, score: 0, scenario: null });
  },

  deductCost: (amount) => {
    const { mode, budget, spent } = get();
    if (mode === 'sandbox') {
      set({ spent: spent + amount });
      return true;
    }
    if (spent + amount > budget) return false;
    set({ spent: spent + amount });
    return true;
  },

  addCost: (amount) => {
    set((s) => ({ spent: Math.max(0, s.spent - amount) }));
  },

  setScenario: (scenario) => {
    set({ scenario, mode: 'scenario', budget: BUDGET_MODE_START, spent: 0, score: 0 });
  },

  updateScore: (score) => set({ score }),

  resetGame: () => set(defaultState()),

  loadGame: (state) => set(state),
}));
