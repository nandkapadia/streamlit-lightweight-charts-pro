/**
 * Series ids shared by the dialog, the chart component, and Python session state.
 *
 * Format: pane-{paneId}-series-{perPaneIndex}
 * perPaneIndex counts series inside that pane, starting at 0. It is not the
 * index of the series in the chart-wide series list.
 */

export function paneSeriesId(
  paneId: string | number,
  perPaneIndex: number,
): string {
  return `pane-${paneId}-series-${perPaneIndex}`;
}

/**
 * Pane id stored on a series, normalized for id comparison.
 * Series created without an explicit pane belong to pane 0.
 */
export function normalizedPaneId(
  paneId: string | number | null | undefined,
): string {
  if (paneId === undefined || paneId === null || paneId === "") {
    return "0";
  }
  return String(paneId);
}
