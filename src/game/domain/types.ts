export type PlayerId = string;

export type StrategyId = 'mira' | 'knox' | 'vega';

export type Controller =
  | { readonly type: 'human' }
  | { readonly type: 'strategy'; readonly strategyId: StrategyId };

export interface PlayerDefinition {
  readonly id: PlayerId;
  readonly name: string;
  readonly seatIndex: number;
  readonly controller: Controller;
}

export interface PlayerState {
  readonly id: PlayerId;
  readonly score: number;
  readonly active: boolean;
}

export interface GameConfigInput {
  readonly rounds: number;
  readonly seedCode: string;
  readonly players: readonly PlayerDefinition[];
}

export interface GameConfig {
  readonly rounds: 10;
  readonly seedCode: string;
  readonly players: readonly PlayerDefinition[];
}

export type GamePhase =
  | 'awaiting-roll'
  | 'resolving-roll'
  | 'awaiting-decisions'
  | 'resolving-decisions'
  | 'round-complete'
  | 'game-complete';

export type Decision = 'bank' | 'stay';

export interface RoundState {
  readonly roundNumber: number;
  readonly pot: number;
  readonly rollNumber: number;
  readonly dangerRolls: number;
  readonly activePlayerIds: readonly PlayerId[];
  readonly currentPlayerId: PlayerId;
}

export interface DecisionSnapshot {
  readonly pot: number;
  readonly scores: Readonly<Record<PlayerId, number>>;
  readonly activePlayerIds: readonly PlayerId[];
  readonly pendingPlayerIds: readonly PlayerId[];
  readonly decisions: Readonly<Partial<Record<PlayerId, Decision>>>;
}

export interface GameState {
  readonly config: GameConfig;
  readonly players: readonly PlayerState[];
  readonly phase: GamePhase;
  readonly round: RoundState;
  readonly decisionSnapshot?: DecisionSnapshot;
}

export type Command =
  | { readonly type: 'ROLL_DICE' }
  | { readonly type: 'COMMIT_ROLL' }
  | {
      readonly type: 'SUBMIT_DECISION';
      readonly playerId: PlayerId;
      readonly decision: Decision;
    }
  | { readonly type: 'RESOLVE_STRATEGY_DECISIONS' }
  | { readonly type: 'COMMIT_DECISIONS' }
  | { readonly type: 'ADVANCE_ROUND' };

export type DomainEvent =
  | {
      readonly type: 'DiceRolled';
      readonly playerId: PlayerId;
      readonly dice: readonly [number, number];
    }
  | {
      readonly type: 'RoundBusted';
      readonly roundNumber: number;
      readonly pot: number;
    }
  | {
      readonly type: 'PlayerBanked';
      readonly playerId: PlayerId;
      readonly amount: number;
    }
  | { readonly type: 'RoundCompleted'; readonly roundNumber: number }
  | { readonly type: 'GameCompleted'; readonly winnerIds: readonly PlayerId[] };

export type ConfigErrorCode =
  | 'INVALID_PLAYER_COUNT'
  | 'INVALID_ROUND_COUNT'
  | 'INVALID_SEAT_INDEX'
  | 'DUPLICATE_PLAYER_ID'
  | 'DUPLICATE_SEAT_INDEX';

export interface ConfigError {
  readonly code: ConfigErrorCode;
  readonly message: string;
}

export type ConfigResult =
  | { readonly ok: true; readonly config: GameConfig }
  | { readonly ok: false; readonly error: ConfigError };

export type TransitionResult =
  | {
      readonly ok: true;
      readonly state: GameState;
      readonly events: readonly DomainEvent[];
    }
  | {
      readonly ok: false;
      readonly state: GameState;
      readonly error: {
        readonly code: 'COMMAND_NOT_ALLOWED';
        readonly command: Command['type'];
        readonly phase: GamePhase;
      };
    };
