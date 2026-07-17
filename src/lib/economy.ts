import { supabase } from './supabase';

export type EconomyFailureCode =
  | 'AUTH_REQUIRED'
  | 'NOT_ELIGIBLE'
  | 'LIMIT_REACHED'
  | 'INSUFFICIENT_POINTS'
  | 'OUT_OF_STOCK'
  | 'EXPIRED'
  | 'ALREADY_PROCESSED'
  | 'INVALID_PROOF'
  | 'ROLLOUT_DISABLED';

export type EconomyCode = 'OK' | EconomyFailureCode;

export interface EconomyOutcome {
  prizeCode: string;
  label: string;
  metadata: Record<string, unknown>;
}

export interface EconomyGameData {
  playId: string;
  outcome: EconomyOutcome;
  costPoints: number;
  rewardPoints: number;
  balance: number | null;
  event: Record<string, unknown> | null;
}

export interface EconomyLedgerEntry {
  id: string;
  delta: number;
  balanceAfter: number;
  entryType: string;
  sourceSite: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}

export interface EconomyWalletData {
  balance: number;
  history: EconomyLedgerEntry[];
}

interface EconomySuccess<TData> {
  ok: true;
  code: 'OK';
  requestId: string;
  data: TData;
}

interface EconomyAlreadyProcessed<TData> {
  ok: false;
  code: 'ALREADY_PROCESSED';
  requestId: string;
  data: TData;
}

interface EconomyFailure {
  ok: false;
  code: Exclude<EconomyFailureCode, 'ALREADY_PROCESSED'>;
  requestId: string;
  data?: never;
}

type EconomyResult<TData> =
  | EconomySuccess<TData>
  | EconomyAlreadyProcessed<TData>
  | EconomyFailure;

export type EconomyGameResult = EconomyResult<EconomyGameData>;
export type EconomyWalletResult = EconomyResult<EconomyWalletData>;

type EconomyRpcName =
  | 'economy_get_wallet'
  | 'play_daily_gacha'
  | 'spin_reward_wheel';

interface WalletRpcParams {
  readonly p_source_site: 'gacha';
  readonly p_history_limit: 20;
  readonly p_request_id: string;
}

interface GameRpcParams {
  readonly p_request_id: string;
}

type EconomyRpcParams = WalletRpcParams | GameRpcParams;
type DataParser<TData> = (value: unknown) => TData | null;

const SAFE_FAILURE_CODE = 'ROLLOUT_DISABLED' as const;
const ECONOMY_RPC_TIMEOUT_MS = 8_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FAILURE_CODES: ReadonlySet<string> = new Set([
  'AUTH_REQUIRED',
  'NOT_ELIGIBLE',
  'LIMIT_REACHED',
  'INSUFFICIENT_POINTS',
  'OUT_OF_STOCK',
  'EXPIRED',
  'ALREADY_PROCESSED',
  'INVALID_PROOF',
  'ROLLOUT_DISABLED',
]);

const ENVELOPE_KEYS = ['ok', 'code', 'request_id', 'data'] as const;
const WALLET_DATA_KEYS = ['balance', 'history'] as const;
const GAME_DATA_KEYS = [
  'play_id',
  'outcome',
  'cost_points',
  'reward_points',
  'balance',
  'event',
] as const;
const GAME_REPLAY_DATA_KEYS = GAME_DATA_KEYS;
const OUTCOME_KEYS = ['prize_code', 'label', 'metadata'] as const;
const LEDGER_ENTRY_KEYS = [
  'id',
  'delta',
  'balance_after',
  'entry_type',
  'source_site',
  'reference_type',
  'reference_id',
  'created_at',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExactRecord(
  value: unknown,
  expectedKeys: readonly string[],
): value is Record<string, unknown> {
  if (!isRecord(value)) return false;

  const actualKeys = Object.keys(value);
  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key) => expectedKeys.includes(key))
  );
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFailureCode(value: unknown): value is EconomyFailureCode {
  return typeof value === 'string' && FAILURE_CODES.has(value);
}

function parseLedgerEntry(value: unknown): EconomyLedgerEntry | null {
  if (!isExactRecord(value, LEDGER_ENTRY_KEYS)) return null;
  if (!isUuid(value.id)) return null;
  if (typeof value.delta !== 'number' || !Number.isSafeInteger(value.delta) || value.delta === 0) {
    return null;
  }
  if (!isNonNegativeSafeInteger(value.balance_after)) return null;
  if (!isNonEmptyString(value.entry_type)) return null;
  if (!isNonEmptyString(value.source_site)) return null;
  if (!isNonEmptyString(value.reference_type)) return null;
  if (!isNonEmptyString(value.reference_id)) return null;
  if (!isNonEmptyString(value.created_at)) return null;

  return {
    id: value.id,
    delta: value.delta,
    balanceAfter: value.balance_after,
    entryType: value.entry_type,
    sourceSite: value.source_site,
    referenceType: value.reference_type,
    referenceId: value.reference_id,
    createdAt: value.created_at,
  };
}

function parseWalletData(value: unknown): EconomyWalletData | null {
  if (!isExactRecord(value, WALLET_DATA_KEYS)) return null;
  if (!isNonNegativeSafeInteger(value.balance)) return null;
  if (!Array.isArray(value.history)) return null;

  const history = value.history.map(parseLedgerEntry);
  if (history.some((entry) => entry === null)) return null;

  return { balance: value.balance, history: history as EconomyLedgerEntry[] };
}

function parseOutcome(value: unknown): EconomyOutcome | null {
  if (!isExactRecord(value, OUTCOME_KEYS)) return null;
  if (typeof value.prize_code !== 'string') return null;
  if (typeof value.label !== 'string') return null;
  if (!isRecord(value.metadata)) return null;

  return {
    prizeCode: value.prize_code,
    label: value.label,
    metadata: { ...value.metadata },
  };
}

function parseGameCore(value: Record<string, unknown>): Omit<EconomyGameData, 'balance' | 'event'> | null {
  if (!isUuid(value.play_id)) return null;

  const outcome = parseOutcome(value.outcome);
  if (!outcome) return null;
  if (!isNonNegativeSafeInteger(value.cost_points)) return null;
  if (!isNonNegativeSafeInteger(value.reward_points)) return null;
  return {
    playId: value.play_id,
    outcome,
    costPoints: value.cost_points,
    rewardPoints: value.reward_points,
  };
}

function parseGameSuccessData(value: unknown): EconomyGameData | null {
  if (!isExactRecord(value, GAME_DATA_KEYS)) return null;
  const core = parseGameCore(value);
  if (!core) return null;
  if (!isNonNegativeSafeInteger(value.balance)) return null;
  if (!isRecord(value.event)) return null;

  return { ...core, balance: value.balance, event: { ...value.event } };
}

function parseGameReplayData(value: unknown): EconomyGameData | null {
  if (!isExactRecord(value, GAME_REPLAY_DATA_KEYS)) return null;
  return parseGameSuccessData(value);
}

function failClosed<TData>(requestId: string): EconomyResult<TData> {
  return {
    ok: false,
    code: SAFE_FAILURE_CODE,
    requestId,
  };
}

function parseEnvelope<TData>(
  value: unknown,
  expectedRequestId: string,
  parseSuccessData: DataParser<TData>,
  parseReplayData: DataParser<TData>,
): EconomyResult<TData> | null {
  if (!isExactRecord(value, ENVELOPE_KEYS)) return null;
  if (typeof value.ok !== 'boolean') return null;
  if (!isUuid(value.request_id) || value.request_id !== expectedRequestId) {
    return null;
  }

  if (value.ok) {
    if (value.code !== 'OK') return null;

    const data = parseSuccessData(value.data);
    if (data === null) return null;

    return {
      ok: true,
      code: 'OK',
      requestId: value.request_id,
      data,
    };
  }

  if (!isFailureCode(value.code)) return null;

  if (value.code === 'ALREADY_PROCESSED') {
    const data = parseReplayData(value.data);
    if (data === null) return null;

    return {
      ok: false,
      code: 'ALREADY_PROCESSED',
      requestId: value.request_id,
      data,
    };
  }

  // Canonical failures carry an empty or diagnostic object. The UI preserves
  // only the allow-listed code and never exposes backend fields.
  if (!isRecord(value.data)) return null;

  return {
    ok: false,
    code: value.code,
    requestId: value.request_id,
  };
}

async function invokeEconomyRpc<TData>(
  rpcName: EconomyRpcName,
  params: EconomyRpcParams,
  requestId: string,
  parseSuccessData: DataParser<TData>,
  parseReplayData: DataParser<TData>,
): Promise<EconomyResult<TData>> {
  if (!supabase) return failClosed(requestId);

  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
  try {
    const rpcResult = await Promise.race([
      Promise.resolve(supabase.rpc(rpcName, params)),
      new Promise<null>((resolve) => {
        timeoutId = globalThis.setTimeout(() => resolve(null), ECONOMY_RPC_TIMEOUT_MS);
      }),
    ]);
    if (rpcResult === null) return failClosed(requestId);

    const { data, error } = rpcResult;
    if (error) return failClosed(requestId);

    return parseEnvelope(data, requestId, parseSuccessData, parseReplayData) ?? failClosed(requestId);
  } catch {
    return failClosed(requestId);
  } finally {
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
  }
}

function createRequestId(): string {
  return globalThis.crypto.randomUUID();
}

export function getEconomyWallet(): Promise<EconomyWalletResult> {
  const requestId = createRequestId();
  const params: WalletRpcParams = {
    p_source_site: 'gacha',
    p_history_limit: 20,
    p_request_id: requestId,
  };

  return invokeEconomyRpc(
    'economy_get_wallet',
    params,
    requestId,
    parseWalletData,
    parseWalletData,
  );
}

export function playDailyGacha(): Promise<EconomyGameResult> {
  const requestId = createRequestId();
  const params: GameRpcParams = { p_request_id: requestId };

  return invokeEconomyRpc(
    'play_daily_gacha',
    params,
    requestId,
    parseGameSuccessData,
    parseGameReplayData,
  );
}

export function spinRewardWheel(): Promise<EconomyGameResult> {
  const requestId = createRequestId();
  const params: GameRpcParams = { p_request_id: requestId };

  return invokeEconomyRpc(
    'spin_reward_wheel',
    params,
    requestId,
    parseGameSuccessData,
    parseGameReplayData,
  );
}
