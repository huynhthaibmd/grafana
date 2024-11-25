import { memo } from 'react';

import { DataFrame, getFieldDisplayName, getFieldSeriesColor } from '@grafana/data';
import { VizLegendOptions, AxisPlacement } from '@grafana/schema';

import { useTheme2 } from '../../themes';
import { VizLayout, VizLayoutLegendProps } from '../VizLayout/VizLayout';
import { VizLegend } from '../VizLegend/VizLegend';
import { VizLegendItem } from '../VizLegend/types';

import { UPlotConfigBuilder } from './config/UPlotConfigBuilder';
import { getDisplayValuesForCalcs } from './utils';

interface PlotLegendProps extends VizLegendOptions, Omit<VizLayoutLegendProps, 'children'> {
  data: DataFrame[];
  config: UPlotConfigBuilder;
}

/**
 * mostly duplicates logic in PlotLegend below :(
 *
 * @internal
 */
export function hasVisibleLegendSeries(config: UPlotConfigBuilder, data: DataFrame[]) {
  return config.getSeries().some((s) => {
    const fieldIndex = s.props.dataFrameFieldIndex;

    if (!fieldIndex) {
      return false;
    }

    const field = data[fieldIndex.frameIndex]?.fields[fieldIndex.fieldIndex];

    if (!field || field.config.custom?.hideFrom?.legend) {
      return false;
    }

    return true;
  });
}

export const PlotLegend = memo(
  ({ data, config, placement, calcs, displayMode, ...vizLayoutLegendProps }: PlotLegendProps) => {
    const theme = useTheme2();

    const alignedFrame = data[0]!;
    const cfgSeries = config.getSeries();

    const legendItems: VizLegendItem[] = alignedFrame.fields
      .map((field, i) => {
        if (i === 0 || field.config.custom?.hideFrom.legend) {
          return undefined;
        }

        const dataFrameFieldIndex = field.state?.origin!;

        const seriesConfig = cfgSeries.find(({ props }) => {
          const { dataFrameFieldIndex: dataFrameFieldIndexCfg } = props;

          return (
            dataFrameFieldIndexCfg?.frameIndex === dataFrameFieldIndex.frameIndex &&
            dataFrameFieldIndexCfg?.fieldIndex === dataFrameFieldIndex.fieldIndex
          );
        })!;

        const axisPlacement = config.getAxisPlacement(seriesConfig.props.scaleKey);

        const label = field.state?.displayName ?? field.name;
        const scaleColor = getFieldSeriesColor(field, theme);
        const seriesColor = scaleColor.color;

        return {
          disabled: field.state?.hideFrom?.viz,
          fieldIndex: dataFrameFieldIndex,
          color: seriesColor,
          label,
          yAxis: axisPlacement === AxisPlacement.Left || axisPlacement === AxisPlacement.Bottom ? 1 : 2,
          getDisplayValues: () => getDisplayValuesForCalcs(calcs, field, theme),
          getItemKey: () => `${label}-${dataFrameFieldIndex.frameIndex}-${dataFrameFieldIndex.fieldIndex}`,
          lineStyle: field.config.custom.lineStyle,
        };
      })
      .filter((item) => item !== undefined);

    // const legendItems = config
    //   .getSeries()
    //   .map<VizLegendItem | undefined>((s) => {
    //     const seriesConfig = s.props;
    //     const fieldIndex = seriesConfig.dataFrameFieldIndex;
    //     const axisPlacement = config.getAxisPlacement(s.props.scaleKey);

    //     if (!fieldIndex) {
    //       return undefined;
    //     }

    //     const field = data[fieldIndex.frameIndex]?.fields[fieldIndex.fieldIndex];

    //     if (!field || field.config.custom?.hideFrom?.legend) {
    //       return undefined;
    //     }

    //     const label = getFieldDisplayName(field, data[fieldIndex.frameIndex]!, data);
    //     const scaleColor = getFieldSeriesColor(field, theme);
    //     const seriesColor = scaleColor.color;

    //     return {
    //       disabled: !(seriesConfig.show ?? true),
    //       fieldIndex,
    //       color: seriesColor,
    //       label,
    //       yAxis: axisPlacement === AxisPlacement.Left || axisPlacement === AxisPlacement.Bottom ? 1 : 2,
    //       getDisplayValues: () => getDisplayValuesForCalcs(calcs, field, theme),
    //       getItemKey: () => `${label}-${fieldIndex.frameIndex}-${fieldIndex.fieldIndex}`,
    //       lineStyle: seriesConfig.lineStyle,
    //     };
    //   })
    //   .filter((i): i is VizLegendItem => i !== undefined);

    return (
      <VizLayout.Legend placement={placement} {...vizLayoutLegendProps}>
        <VizLegend
          placement={placement}
          items={legendItems}
          displayMode={displayMode}
          sortBy={vizLayoutLegendProps.sortBy}
          sortDesc={vizLayoutLegendProps.sortDesc}
          isSortable={true}
        />
      </VizLayout.Legend>
    );
  }
);

PlotLegend.displayName = 'PlotLegend';
