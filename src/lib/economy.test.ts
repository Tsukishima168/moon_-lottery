import {
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';

type RpcArguments = Readonly<Record<string, unknown>>;
type RpcResponse = Readonly<{ data: unknown; error: unknown }>;
type RpcCall = (rpcName: string, params: RpcArguments) => Promise<RpcResponse>;
interface MockSupabaseClient {
  rpc: RpcCall;
}

const mocks = vi.hoisted(() => {
  const rpc = vi.fn<RpcCall>();
  return {
    rpc,
    client: { rpc } as MockSupabaseClient | null,
  };
});

vi.mock('./supabase', () => ({
  get supabase(): MockSupabaseClient | null {
    return mocks.client;
  },
}));

import {
  getEconomyWallet,
  playDailyGacha,
  spinRewardWheel,
  type EconomyGameResult,
} from './economy';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLAY_ID = '9af8f43a-bdc8-4df5-a356-20f3f3dc7172';

function getRequestId(params: RpcArguments): string {
  const requestId = params.p_request_id;
  if (typeof requestId !== 'string') {
    throw new Error('Test RPC did not receive p_request_id');
  }
  return requestId;
}

function mockWalletSuccess(balance = 240): void {
  mocks.rpc.mockImplementation(async (_rpcName, params) => ({
    data: {
      ok: true,
      code: 'OK',
      request_id: getRequestId(params),
      data: { balance, history: [] },
    },
    error: null,
  }));
}

function gameData(balance: number | null = 140) {
  return {
    play_id: PLAY_ID,
    outcome: {
      prize_code: 'points_50',
      label: '50 點',
      metadata: { campaign: 'daily' },
    },
    cost_points: 30,
    reward_points: 50,
    balance,
    event: { event_id: PLAY_ID },
  };
}

function mockGameSuccess(balance: number | null = 140): void {
  mocks.rpc.mockImplementation(async (_rpcName, params) => ({
    data: {
      ok: true,
      code: 'OK',
      request_id: getRequestId(params),
      data: gameData(balance),
    },
    error: null,
  }));
}

function firstRpcCall(): readonly [string, RpcArguments] {
  const call = mocks.rpc.mock.calls[0];
  if (!call) throw new Error('Expected an RPC call');
  return call;
}

beforeEach(() => {
  mocks.rpc.mockReset();
  mocks.client = { rpc: mocks.rpc };
});

describe('Economy RPC request contract', () => {
  it('sends the exact wallet request and parses its success envelope', async () => {
    mockWalletSuccess();

    const result = await getEconomyWallet();
    const [rpcName, params] = firstRpcCall();
    const requestId = getRequestId(params);

    expect(rpcName).toBe('economy_get_wallet');
    expect(params).toEqual({
      p_source_site: 'gacha',
      p_history_limit: 20,
      p_request_id: expect.stringMatching(UUID_PATTERN),
    });
    expect(result).toEqual({
      ok: true,
      code: 'OK',
      requestId,
      data: { balance: 240, history: [] },
    });
  });

  it.each([
    ['play_daily_gacha', playDailyGacha],
    ['spin_reward_wheel', spinRewardWheel],
  ] as const)('sends only p_request_id to %s', async (rpcName, operation) => {
    mockGameSuccess();

    await operation();
    const [calledName, params] = firstRpcCall();

    expect(calledName).toBe(rpcName);
    expect(params).toEqual({
      p_request_id: expect.stringMatching(UUID_PATTERN),
    });
  });

  it('does not forward a forged amount argument', async () => {
    mockGameSuccess();
    expectTypeOf(playDailyGacha).parameters.toEqualTypeOf<[]>();

    const forgedCall = playDailyGacha as unknown as (
      payload: Readonly<{ amount: number }>,
    ) => Promise<EconomyGameResult>;
    await forgedCall({ amount: 999_999 });

    const [, params] = firstRpcCall();
    expect(params).toEqual({
      p_request_id: expect.stringMatching(UUID_PATTERN),
    });
    expect(params).not.toHaveProperty('amount');
  });
});

describe('Economy response validation', () => {
  it('maps a safe game success to the fixed camelCase UI contract', async () => {
    mockGameSuccess(140);

    const result = await playDailyGacha();
    const [, params] = firstRpcCall();

    expect(result).toEqual({
      ok: true,
      code: 'OK',
      requestId: getRequestId(params),
      data: {
        playId: PLAY_ID,
        outcome: {
          prizeCode: 'points_50',
          label: '50 點',
          metadata: { campaign: 'daily' },
        },
        costPoints: 30,
        rewardPoints: 50,
        balance: 140,
        event: { event_id: PLAY_ID },
      },
    });
  });

  it('passes through an allowed server failure without data', async () => {
    mocks.rpc.mockImplementation(async (_rpcName, params) => ({
      data: {
        ok: false,
        code: 'AUTH_REQUIRED',
        request_id: getRequestId(params),
        data: {},
      },
      error: null,
    }));

    const result = await playDailyGacha();
    const [, params] = firstRpcCall();

    expect(result).toEqual({
      ok: false,
      code: 'AUTH_REQUIRED',
      requestId: getRequestId(params),
    });
  });

  it('parses the canonical replay result without a balance', async () => {
    mocks.rpc.mockImplementation(async (_rpcName, params) => {
      const replay = gameData();
      const { balance: _balance, event: _event, ...replayWithoutBalance } = replay;
      return {
        data: {
          ok: false,
          code: 'ALREADY_PROCESSED',
          request_id: getRequestId(params),
          data: replayWithoutBalance,
        },
        error: null,
      };
    });

    const result = await playDailyGacha();

    expect(result.ok).toBe(false);
    expect(result.code).toBe('ALREADY_PROCESSED');
    if (result.code === 'ALREADY_PROCESSED') {
      expect(result.data.balance).toBeNull();
      expect(result.data.event).toBeNull();
      expect(result.data.playId).toBe(PLAY_ID);
    }
  });

  it('fails closed on an unknown server code', async () => {
    mocks.rpc.mockImplementation(async (_rpcName, params) => ({
      data: {
        ok: false,
        code: 'UNEXPECTED_BACKEND_CODE',
        request_id: getRequestId(params),
        data: {},
      },
      error: null,
    }));

    const result = await spinRewardWheel();
    const [, params] = firstRpcCall();

    expect(result).toEqual({
      ok: false,
      code: 'ROLLOUT_DISABLED',
      requestId: getRequestId(params),
    });
    expect(JSON.stringify(result)).not.toContain('UNEXPECTED_BACKEND_CODE');
  });

  it.each([
    ['cost_points', -1],
    ['reward_points', 0.5],
    ['balance', -1],
    ['balance', 1.25],
    ['reward_points', Number.MAX_SAFE_INTEGER + 1],
  ] as const)('rejects invalid game %s value %s', async (field, value) => {
    mocks.rpc.mockImplementation(async (_rpcName, params) => ({
      data: {
        ok: true,
        code: 'OK',
        request_id: getRequestId(params),
        data: { ...gameData(), [field]: value },
      },
      error: null,
    }));

    const result = await playDailyGacha();
    const [, params] = firstRpcCall();

    expect(result).toEqual({
      ok: false,
      code: 'ROLLOUT_DISABLED',
      requestId: getRequestId(params),
    });
  });

  it.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid wallet balance %s',
    async (balance) => {
      mockWalletSuccess(balance);

      const result = await getEconomyWallet();
      const [, params] = firstRpcCall();

      expect(result).toEqual({
        ok: false,
        code: 'ROLLOUT_DISABLED',
        requestId: getRequestId(params),
      });
    },
  );

  it('rejects a wallet success without canonical history', async () => {
    mocks.rpc.mockImplementation(async (_rpcName, params) => ({
      data: {
        ok: true,
        code: 'OK',
        request_id: getRequestId(params),
        data: { balance: 10 },
      },
      error: null,
    }));

    const result = await getEconomyWallet();
    expect(result.code).toBe('ROLLOUT_DISABLED');
  });

  it.each(['balance', 'event'] as const)(
    'rejects a game success without canonical %s',
    async (field) => {
      mocks.rpc.mockImplementation(async (_rpcName, params) => {
        const { [field]: _omitted, ...data } = gameData();
        return {
          data: {
            ok: true,
            code: 'OK',
            request_id: getRequestId(params),
            data,
          },
          error: null,
        };
      });

      const result = await playDailyGacha();
      expect(result.code).toBe('ROLLOUT_DISABLED');
    },
  );

  it('rejects envelopes with unrecognized fields', async () => {
    mocks.rpc.mockImplementation(async (_rpcName, params) => ({
      data: {
        ok: true,
        code: 'OK',
        request_id: getRequestId(params),
        data: gameData(),
        server_message: 'must not reach UI',
      },
      error: null,
    }));

    const result = await playDailyGacha();
    const [, params] = firstRpcCall();

    expect(result).toEqual({
      ok: false,
      code: 'ROLLOUT_DISABLED',
      requestId: getRequestId(params),
    });
  });
});

describe('Economy fail-closed behavior', () => {
  it('returns one safe error and hides Supabase transport details', async () => {
    const backendMessage = 'private database transport detail';
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: backendMessage },
    });

    const result = await getEconomyWallet();
    const [, params] = firstRpcCall();

    expect(result).toEqual({
      ok: false,
      code: 'ROLLOUT_DISABLED',
      requestId: getRequestId(params),
    });
    expect(JSON.stringify(result)).not.toContain(backendMessage);
  });

  it('fails closed without making a request when the singleton is absent', async () => {
    mocks.client = null;

    const result = await spinRewardWheel();

    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      code: 'ROLLOUT_DISABLED',
      requestId: expect.stringMatching(UUID_PATTERN),
    });
  });

  it('fails closed when the RPC does not settle before the timeout', async () => {
    vi.useFakeTimers();
    mocks.rpc.mockImplementation(
      () => new Promise<RpcResponse>(() => undefined),
    );

    try {
      const pending = playDailyGacha();
      await vi.advanceTimersByTimeAsync(8_000);
      const result = await pending;
      const [, params] = firstRpcCall();

      expect(result).toEqual({
        ok: false,
        code: 'ROLLOUT_DISABLED',
        requestId: getRequestId(params),
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
