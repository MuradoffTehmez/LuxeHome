import { cn } from "@/lib/utils";

/**
 * Asılılıqsız, server tərəfdə çəkilən qrafiklər (#234, PRD 11.5). Rənglər tokenlərdəndir (dark mode
 * özü işləyir); hər qrafikin yanında ekran oxuyucu üçün eyni məlumatın cədvəli var.
 */

type Series = { key: string; label: string; className: string };

/** Xətti qrafik: gün üzrə bir neçə seriya, ortaq şaquli şkala. */
export function LineChart({
  points,
  series,
  label,
  formatDay,
}: {
  points: ({ day: string } & Record<string, number | string>)[];
  series: Series[];
  label: string;
  formatDay: (day: string) => string;
}) {
  const width = 640;
  const height = 200;
  const pad = { top: 12, right: 12, bottom: 24, left: 36 };
  const max = Math.max(1, ...points.flatMap((point) => series.map((item) => Number(point[item.key]) || 0)));
  const x = (index: number) => pad.left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * (width - pad.left - pad.right));
  const y = (value: number) => pad.top + (1 - value / max) * (height - pad.top - pad.bottom);
  const ticks = [0, Math.round(max / 2), max];
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    // `relative` — içindəki `sr-only` (absolute) cədvəl konteynerdən qaçıb sənədi üfüqi daşdırmasın.
    <figure className="relative flex flex-col gap-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="stroke-line" strokeDasharray="3 4" />
            <text x={pad.left - 6} y={y(tick) + 4} textAnchor="end" className="fill-ink-muted text-[10px]">{tick}</text>
          </g>
        ))}
        {points.map((point, index) => index % labelEvery === 0 && (
          <text key={point.day} x={x(index)} y={height - 6} textAnchor={index === points.length - 1 && points.length > 1 ? "end" : "middle"} className="fill-ink-muted text-[10px]">{formatDay(point.day)}</text>
        ))}
        {series.map((item) => (
          <polyline
            key={item.key}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className={item.className}
            points={points.map((point, index) => `${x(index)},${y(Number(point[item.key]) || 0)}`).join(" ")}
          />
        ))}
      </svg>
      <figcaption className="flex flex-wrap gap-4 text-xs text-ink-soft">
        {series.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 12 4" className="h-1 w-4" aria-hidden="true"><line x1="0" x2="12" y1="2" y2="2" strokeWidth={4} className={item.className} /></svg>
            {item.label}
          </span>
        ))}
      </figcaption>
      {/* Cədvəl `width: 1px`-ə tabe olmur və məzmun eninə qədər açılır — `sr-only` div-in içindədir. */}
      <div className="sr-only">
      <table>
        <caption>{label}</caption>
        <thead><tr><th scope="col">—</th>{series.map((item) => <th key={item.key} scope="col">{item.label}</th>)}</tr></thead>
        <tbody>{points.map((point) => <tr key={point.day}><th scope="row">{point.day}</th>{series.map((item) => <td key={item.key}>{point[item.key]}</td>)}</tr>)}</tbody>
      </table>
      </div>
    </figure>
  );
}

/** Üfüqi sütunlar: ad, dəyər və (istəyə bağlı) cəmdən faiz. */
export function BarList({
  items,
  label,
  showShare = false,
  barClassName = "bg-gold",
}: {
  items: { key: string; label: string; value: number; hint?: string }[];
  label: string;
  showShare?: boolean;
  barClassName?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <ul className="flex flex-col gap-2" aria-label={label}>
      {items.map((item) => (
        <li key={item.key} className="grid grid-cols-[minmax(0,15rem)_minmax(3rem,1fr)_auto] items-center gap-3 text-sm">
          <span className="text-ink-soft [overflow-wrap:anywhere]">{item.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <span className={cn("block h-full rounded-full", barClassName)} style={{ width: `${(item.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-medium text-ink tabular-nums">
            {item.value}
            {showShare && total > 0 && <span className="ml-1 text-xs font-normal text-ink-muted">({Math.round((item.value / total) * 100)}%)</span>}
            {item.hint && <span className="ml-1 text-xs font-normal text-ink-muted">{item.hint}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
