import { describe, it, expect } from 'vitest';
import {
  applyChartOptionDefaults,
  pinnedContainerSize,
  resolveLegacySizing,
} from '../../utils/chartOptionDefaults';

describe('applyChartOptionDefaults', () => {
  describe('crosshair snapping to hidden series', () => {
    it('stops snapping to hidden series when the option is unset', () => {
      const result = applyChartOptionDefaults({}, {});

      expect(result.crosshair).toEqual({ doNotSnapToHiddenSeriesIndices: true });
    });

    it('keeps an explicit false from the user', () => {
      const result = applyChartOptionDefaults(
        { crosshair: { doNotSnapToHiddenSeriesIndices: false } },
        {}
      );

      expect(result.crosshair).toEqual({ doNotSnapToHiddenSeriesIndices: false });
    });

    it('preserves the other crosshair options', () => {
      const result = applyChartOptionDefaults(
        { crosshair: { mode: 1, vertLine: { color: '#fff' } } },
        {}
      );

      expect(result.crosshair).toEqual({
        mode: 1,
        vertLine: { color: '#fff' },
        doNotSnapToHiddenSeriesIndices: true,
      });
    });

    it('does not mutate the options it is given', () => {
      const crosshair = { mode: 1 };
      const options = { crosshair };

      applyChartOptionDefaults(options, {});

      expect(options.crosshair).toBe(crosshair);
      expect(crosshair).toEqual({ mode: 1 });
    });
  });

  describe('autoSize', () => {
    it('passes the chart autoSize option through unchanged', () => {
      expect(applyChartOptionDefaults({ autoSize: true }, {}).autoSize).toBe(true);
      expect(applyChartOptionDefaults({ autoSize: false }, {}).autoSize).toBe(false);
      expect(applyChartOptionDefaults({}, {})).not.toHaveProperty('autoSize');
    });

    it.each(['autoSize', 'autoWidth', 'autoHeight'] as const)(
      'turns on autoSize for the legacy top-level %s flag',
      flag => {
        const result = applyChartOptionDefaults({ autoSize: false }, { [flag]: true });

        expect(result.autoSize).toBe(true);
      }
    );
  });
});

describe('resolveLegacySizing', () => {
  it('reads nested chart.autoSize when top-level flags are unset', () => {
    expect(
      resolveLegacySizing({ chart: { autoSize: true, autoWidth: true } } as never)
    ).toEqual({ autoSize: true, autoWidth: true, autoHeight: undefined });
  });

  it('prefers top-level flags over nested chart flags', () => {
    expect(
      resolveLegacySizing({
        autoHeight: true,
        chart: { autoHeight: false, autoSize: true },
      } as never)
    ).toEqual({ autoSize: true, autoWidth: undefined, autoHeight: true });
  });
});

describe('pinnedContainerSize', () => {
  const configured = { width: 640, height: 300 };

  it('pins the height when only autoWidth is set', () => {
    expect(pinnedContainerSize({ autoWidth: true }, configured)).toEqual({ height: '300px' });
  });

  it('pins the width when only autoHeight is set', () => {
    expect(pinnedContainerSize({ autoHeight: true }, configured)).toEqual({ width: '640px' });
  });

  it.each([
    ['autoSize', { autoSize: true, autoWidth: true }],
    ['both axes', { autoWidth: true, autoHeight: true }],
    ['no flags', {}],
  ])('pins nothing for %s', (_label, flags) => {
    expect(pinnedContainerSize(flags, configured)).toEqual({});
  });

  it('pins nothing when the fixed dimension is not configured', () => {
    expect(pinnedContainerSize({ autoWidth: true }, { width: 640, height: null })).toEqual({});
  });
});
