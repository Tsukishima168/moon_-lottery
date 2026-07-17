import { describe, expect, it } from 'vitest';
import { presentWheelPrize } from './wheelService';

describe('wheel presentation map', () => {
  it('uses server reward points without computing an economic result', () => {
    expect(presentWheelPrize('points_25', '金色幸運', 37)).toMatchObject({
      id: 'points_25',
      name: '金色幸運',
      rewardPoints: 37,
      color: '#D4AF37',
    });
  });

  it.each(['unknown_prize', '__proto__', 'constructor'])(
    'uses a safe fallback for %s',
    (prizeCode) => {
      expect(presentWheelPrize(prizeCode, '  ', 0)).toEqual({
        id: prizeCode,
        name: 'Kiwimu 幸運獎勵',
        color: '#D4FF00',
        textColor: '#111111',
        icon: 'K',
        description: '本次結果已由伺服器記錄。',
        rewardPoints: 0,
      });
    },
  );
});
