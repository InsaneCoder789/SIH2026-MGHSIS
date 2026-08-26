export function TrendChart({ values, color, suffix = "" }: { values: number[]; color: string; suffix?: string }) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(1, maximum - minimum);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 300},${70 - ((value - minimum) / range) * 52}`).join(" ");
  return <div className="trend-chart"><svg viewBox="0 0 300 82" role="img" aria-label={`Trend from ${values[0]} to ${values.at(-1)}${suffix}`}><line x1="0" y1="70" x2="300" y2="70" className="chart-axis" /><polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />{values.map((value,index) => <circle key={index} cx={(index / (values.length - 1)) * 300} cy={70 - ((value - minimum) / range) * 52} r="2" fill={color} />)}</svg><footer><span>{minimum}{suffix} min</span><strong>{values.at(-1)}{suffix} latest</strong><span>{maximum}{suffix} max</span></footer></div>;
}
