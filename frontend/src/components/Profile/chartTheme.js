/**
 * Chart.js styling, read from the token layer.
 *
 * The charts this replaces carried ~450 lines of inline options with hardcoded
 * hex per category, three separate `getColor` closures that each re-derived the
 * same palette, and light-mode greys baked in — so on the dark ground the axes
 * and tooltips were nearly invisible. Reading the CSS variables means the charts
 * follow the theme toggle for free.
 */

const cssVar = (name, fallback) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

export const chartColors = () => ({
  beam: cssVar("--color-beam", "#e8a33d"),
  ink: cssVar("--color-ink", "#f4f1ea"),
  inkFaint: cssVar("--color-ink-faint", "#8a939e"),
  rule: cssVar("--color-rule", "#242b34"),
  surface: cssVar("--color-surface-raised", "#1d232b"),
});

/** Shared axis/legend/tooltip treatment. */
export function baseOptions({ yTitle } = {}) {
  const c = chartColors();

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: c.surface,
        titleColor: c.ink,
        bodyColor: c.ink,
        borderColor: c.rule,
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: c.rule },
        ticks: { color: c.inkFaint, maxRotation: 0, autoSkipPadding: 16 },
      },
      y: {
        beginAtZero: true,
        title: yTitle
          ? { display: true, text: yTitle, color: c.inkFaint }
          : undefined,
        grid: { color: c.rule },
        border: { display: false },
        ticks: { color: c.inkFaint, precision: 0 },
      },
    },
  };
}

/** A score-over-time line. The beam is the only accent, so every series uses it. */
export function lineData(points, label) {
  const c = chartColors();

  return {
    labels: points.map((p) => p.label),
    datasets: [
      {
        label,
        data: points.map((p) => p.value),
        borderColor: c.beam,
        backgroundColor: `${c.beam}22`,
        pointBackgroundColor: c.beam,
        pointBorderColor: c.surface,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  };
}

export function barData(points, label) {
  const c = chartColors();

  return {
    labels: points.map((p) => p.label),
    datasets: [
      {
        label,
        data: points.map((p) => p.value),
        backgroundColor: c.beam,
        borderRadius: 2,
        maxBarThickness: 28,
      },
    ],
  };
}
