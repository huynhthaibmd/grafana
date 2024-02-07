import { DataFrame, Field, TIME_SERIES_VALUE_FIELD_NAME, FieldType, TIME_SERIES_TIME_FIELD_NAME } from '../types';
import { formatLabels } from '../utils/labels';

/**
 * Get an appropriate display title
 */
export function getFrameDisplayName(frame: DataFrame, index?: number, singleLabelName?: string) {
  if (frame.name) {
    return frame.name;
  }

  const valueFieldNames: string[] = [];
  for (const field of frame.fields) {
    if (field.type === FieldType.time) {
      continue;
    }

    // No point in doing more
    if (valueFieldNames.length > 1) {
      break;
    }

    valueFieldNames.push(getFieldDisplayName(field, frame));
  }

  // If the frame has a single value field then use the name of that field as the frame name
  if (valueFieldNames.length === 1) {
    return valueFieldNames[0];
  }

  // If singleLabelName is provided return label and common value
  if (singleLabelName) {
    // Check if value is the same for all non-time fields
    let labelValue = '';
    let commonLabelValue = true;
    for (let i = 0; i < frame.fields.length; i++) {
      const field = frame.fields[i];
      if (field.type === FieldType.time) {
        continue;
      } else if (field.labels) {
        if (labelValue === '') {
          labelValue = field.labels[singleLabelName];
        } else if (field.labels[singleLabelName] !== labelValue) {
          commonLabelValue = false;
          break;
        }
      }
    }
    if (commonLabelValue && labelValue !== '') {
      return labelValue;
    }
  }

  // list all the
  if (index === undefined && frame.fields.length > 0) {
    return frame.fields
      .filter((f) => f.type !== FieldType.time)
      .map((f) => getFieldDisplayName(f, frame))
      .join(', ');
  }

  if (frame.refId) {
    return `Series (${frame.refId})`;
  }

  return `Series (${index})`;
}

export function cacheFieldDisplayNames(frames: DataFrame[]) {
  frames.forEach((frame) => {
    frame.fields.forEach((field) => {
      getFieldDisplayName(field, frame, frames);
    });
  });
}

export function getFieldDisplayName(field: Field, frame?: DataFrame, allFrames?: DataFrame[]): string {
  const existingTitle = field.state?.displayName;
  const multipleFrames = Boolean(allFrames && allFrames.length > 1);

  if (existingTitle && multipleFrames === field.state?.multipleFrames) {
    return existingTitle;
  }

  const displayName = calculateFieldDisplayName(field, frame, allFrames);
  field.state = field.state || {};
  field.state.displayName = displayName;
  field.state.multipleFrames = multipleFrames;

  return displayName;
}

/**
 * Get an appropriate display name. If the 'displayName' field config is set, use that.
 */
export function calculateFieldDisplayName(field: Field, frame?: DataFrame, allFrames?: DataFrame[]): string {
  const hasConfigTitle = field.config?.displayName && field.config?.displayName.length;
  const isComparisonSeries = Boolean(frame?.meta?.timeCompare?.isTimeShiftQuery);
  let displayName = hasConfigTitle ? field.config!.displayName! : field.name;

  if (hasConfigTitle) {
    return isComparisonSeries ? `${displayName} (comparison)` : displayName;
  }

  if (frame && field.config?.displayNameFromDS) {
    return isComparisonSeries ? `${field.config.displayNameFromDS} (comparison)` : field.config.displayNameFromDS;
  }

  // This is an ugly exception for time field
  // For time series we should normally treat time field with same name
  // But in case it has a join source we should handle it as normal field
  if (field.type === FieldType.time && !field.labels) {
    return displayName ?? TIME_SERIES_TIME_FIELD_NAME;
  }

  let parts: string[] = [];
  let frameNamesDiffer = false;

  if (allFrames && allFrames.length > 1) {
    for (let i = 1; i < allFrames.length; i++) {
      const frame = allFrames[i];
      if (frame.name !== allFrames[i - 1].name) {
        frameNamesDiffer = true;
        break;
      }
    }
  }

  let frameNameAdded = false;
  let labelsAdded = false;

  if (frameNamesDiffer && frame?.name) {
    parts.push(frame.name);
    frameNameAdded = true;
  }

  if (field.name && field.name !== TIME_SERIES_VALUE_FIELD_NAME) {
    parts.push(field.name);
  }

  if (field.labels && frame) {
    let singleLabelName = getSingleLabelName(allFrames ?? [frame]);

    if (!singleLabelName) {
      let allLabels = formatLabels(field.labels);
      if (allLabels) {
        parts.push(allLabels);
        labelsAdded = true;
      }
    } else if (field.labels[singleLabelName]) {
      parts.push(field.labels[singleLabelName]);
      labelsAdded = true;
    }
  }

  // if we have not added frame name and no labels, and field name = Value, we should add frame name
  if (frame && !frameNameAdded && !labelsAdded && field.name === TIME_SERIES_VALUE_FIELD_NAME) {
    if (frame.name && frame.name.length > 0) {
      parts.push(frame.name);
      frameNameAdded = true;
    }
  }

  if (parts.length) {
    displayName = parts.join(' ');
  } else if (field.name) {
    displayName = field.name;
  } else {
    displayName = TIME_SERIES_VALUE_FIELD_NAME;
  }

  // Ensure unique field name
  if (displayName === field.name) {
    displayName = getUniqueFieldName(field, frame);
  }

  if (isComparisonSeries) {
    displayName = `${displayName} (comparison)`;
  }
  return displayName;
}

export function getUniqueFieldName(field: Field, frame?: DataFrame) {
  let dupeCount = 0;
  let foundSelf = false;

  if (frame) {
    for (let i = 0; i < frame.fields.length; i++) {
      const otherField = frame.fields[i];

      if (field === otherField) {
        foundSelf = true;

        if (dupeCount > 0) {
          dupeCount++;
          break;
        }
      } else if (field.name === otherField.name) {
        dupeCount++;

        if (foundSelf) {
          break;
        }
      }
    }
  }

  if (dupeCount) {
    return `${field.name} ${dupeCount}`;
  }

  return field.name;
}

/**
 * Checks all data frames and return name of label if there is only one label name in all frames
 */
export function getSingleLabelName(frames: DataFrame[]): string | null {
  let singleName: string | null = null;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    for (const field of frame.fields) {
      if (!field.labels) {
        continue;
      }

      // yes this should be in!
      for (const labelKey in field.labels) {
        if (singleName === null) {
          singleName = labelKey;
        } else if (labelKey !== singleName) {
          return null;
        }
      }
    }
  }

  return singleName;
}
