import PlinkoEngine from '$lib/components/Plinko/PlinkoEngine';
import { binColor } from '$lib/constants/game';
import { RiskLevel, type RowCount, type WinRecord } from '$lib/types';
import { interpolateRgbColors } from '$lib/utils/colors';
import { countValueOccurrences } from '$lib/utils/numbers';
import { persisted } from 'svelte-persisted-store';
import { derived, writable } from 'svelte/store';

const LOCAL_STORAGE_KEY = {
  BALANCE: 'plinko_balance',
} as const;

export const plinkoEngine = writable<PlinkoEngine | null>(null);

export const betAmount = writable<number>(1);

export const rowCount = writable<RowCount>(16);

export const riskLevel = writable<RiskLevel>(RiskLevel.MEDIUM);

export const winRecords = writable<WinRecord[]>([]);

export const balance = persisted<number>(LOCAL_STORAGE_KEY.BALANCE, 200);

/**
 * RGB colors for every bin. The length of the array is the number of bins.
 */
export const binColors = derived<typeof rowCount, { background: string[]; shadow: string[] }>(
  rowCount,
  ($rowCount) => {
    const binCount = $rowCount + 1;
    const isBinsEven = binCount % 2 === 0;
    const redToYellowLength = Math.ceil(binCount / 2);

    const redToYellowBg = interpolateRgbColors(
      binColor.background.red,
      binColor.background.yellow,
      redToYellowLength,
    ).map(({ r, g, b }) => `rgb(${r}, ${g}, ${b})`);

    const redToYellowShadow = interpolateRgbColors(
      binColor.shadow.red,
      binColor.shadow.yellow,
      redToYellowLength,
    ).map(({ r, g, b }) => `rgb(${r}, ${g}, ${b})`);

    return {
      background: [...redToYellowBg, ...redToYellowBg.toReversed().slice(isBinsEven ? 0 : 1)],
      shadow: [...redToYellowShadow, ...redToYellowShadow.toReversed().slice(isBinsEven ? 0 : 1)],
    };
  },
);

export const binProbabilities = derived<
  [typeof winRecords, typeof rowCount],
  { [binIndex: number]: number }
>([winRecords, rowCount], ([$winRecords, $rowCount]) => {
  const occurrences = countValueOccurrences($winRecords.map(({ binIndex }) => binIndex));
  const probabilities: Record<number, number> = {};
  for (let i = 0; i < $rowCount + 1; ++i) {
    probabilities[i] = occurrences[i] / $winRecords.length || 0;
  }
  return probabilities;
});
