/** Linear-scale math — the only "engine" simple dashboards actually need. */

/** Clean tick values (1/2/2.5/5 steps) covering [0|min, max]. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) max = min + 1;
  const span = max - min;
  const rawStep = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  const step = (residual >= 5 ? 5 : residual >= 2.5 ? 2.5 : residual >= 2 ? 2 : 1) * magnitude;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) {
    // kill float noise (0.30000000000000004)
    ticks.push(Number(v.toPrecision(12)));
  }
  return ticks;
}

/** Map a domain value to pixel space. */
export function scaleLinear(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const span = d1 - d0 || 1;
  return (v) => r0 + ((v - d0) / span) * (r1 - r0);
}

/** Default tick/value formatter: compact above 10k, locale-grouped below. */
export function formatNumber(v: number): string {
  if (Math.abs(v) >= 10_000) {
    return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  }
  return v.toLocaleString();
}

/** Series → y domain [0-or-below, nice max] with zero baseline kept. */
export function extent(values: number[]): { min: number; max: number } {
  let min = Math.min(0, ...values);
  let max = Math.max(...values);
  if (max <= min) max = min + 1;
  return { min, max };
}
