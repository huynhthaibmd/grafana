import { css } from '@emotion/css';
import saveAs from 'file-saver';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAsyncFn } from 'react-use';
import { lastValueFrom } from 'rxjs';

import { GrafanaTheme2, UrlQueryMap } from '@grafana/data';
import { config, getBackendSrv } from '@grafana/runtime';
import { Button, Field, Icon, Input, LoadingBar, Stack, Text, Tooltip, useStyles2 } from '@grafana/ui';

import { t, Trans } from '../../../../core/internationalization';

import { SharePanelInternally } from './SharePanelInternally';

type ImageSettingsForm = {
  width: number;
  height: number;
  scaleFactor: number;
};

type Props = {
  title: string;
  buildUrl: (urlParams: UrlQueryMap) => void;
  imageUrl: string;
  disabled: boolean;
  model: SharePanelInternally;
};

export function SharePanelPreview({ title, imageUrl, buildUrl, disabled, model }: Props) {
  const styles = useStyles2(getStyles);

  const {
    handleSubmit,
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<ImageSettingsForm>({
    mode: 'onChange',
    defaultValues: {
      width: 1000,
      height: 500,
      scaleFactor: 1,
    },
  });

  useEffect(() => {
    buildUrl({ width: watch('width'), height: watch('height'), scale: watch('scaleFactor') });
  }, [buildUrl, watch]);

  const [{ loading, value: image }, renderImage] = useAsyncFn(async () => {
    const response = await lastValueFrom(getBackendSrv().fetch<BlobPart>({ url: imageUrl, responseType: 'blob' }));
    return new Blob([response.data], { type: 'image/png' });
  }, [imageUrl, watch('width'), watch('height')]);

  const onDowloadImageClick = () => {
    saveAs(image!, `${title}.png`);
  };

  const onChange = async () => {
    await buildUrl({ width: watch('width'), height: watch('height'), scale: watch('scaleFactor') });
  };

  return (
    <Stack gap={2} direction="column">
      <Text element="h4">
        <Trans i18nKey="share-panel-image.preview.title">Panel preview</Trans>
      </Text>
      <Stack gap={1} alignItems="center">
        <Text element="h5">
          <Trans i18nKey="share-panel-image.settings.title">Image settings</Trans>
        </Text>
        <Tooltip
          content={t(
            'share-panel-image.settings.max-warning',
            'Setting maximums are limited by the image renderer service'
          )}
        >
          <Icon name="info-circle" size="sm" />
        </Tooltip>
      </Stack>
      <form onSubmit={handleSubmit(renderImage)}>
        <Stack gap={1} justifyContent="space-between" direction={{ xs: 'column', sm: 'row' }}>
          <Field
            label="Width"
            className={styles.imageConfigurationField}
            required
            invalid={!!errors.width}
            error={errors.width?.message}
          >
            <Input
              {...register('width', {
                required: t('share-panel-image.settings.width-error', 'Width is required'),
                min: 1,
                onChange: onChange,
              })}
              placeholder="1000"
              type="number"
              suffix="px"
              min={1}
            />
          </Field>
          <Field
            label="Height"
            className={styles.imageConfigurationField}
            required
            invalid={!!errors.height}
            error={errors.height?.message}
          >
            <Input
              {...register('height', {
                required: t('share-panel-image.settings.height-error', 'Height is required'),
                min: 1,
                onChange: onChange,
              })}
              placeholder="500"
              type="number"
              suffix="px"
            />
          </Field>
          <Field
            label={'Scale factor'}
            className={styles.imageConfigurationField}
            required
            invalid={!!errors.scaleFactor}
            error={errors.scaleFactor?.message}
          >
            <Input
              {...register('scaleFactor', {
                required: t('share-panel-image.settings.scale-factor-error', 'Scale factor is required'),
                min: 1,
                onChange: onChange,
              })}
              placeholder="1"
              type="number"
            />
          </Field>
        </Stack>
        <Stack gap={1}>
          <Button
            icon="gf-layout-simple"
            variant="secondary"
            fill="solid"
            type="submit"
            disabled={!config.rendererAvailable || disabled || loading || !isValid}
          >
            <Trans i18nKey="link.share-panel.render-image">Generate image</Trans>
          </Button>
          <Button
            onClick={onDowloadImageClick}
            icon={'download-alt'}
            variant="secondary"
            disabled={!image || loading || disabled}
          >
            <Trans i18nKey="link.share-panel.download-image">Download image</Trans>
          </Button>
        </Stack>
      </form>
      {loading && (
        <div>
          <LoadingBar width={128} />
          <div className={styles.imageLoadingContainer}>
            <Text variant="body">{title || ''}</Text>
          </div>
        </div>
      )}
      {image && !loading && (
        <>
          <img src={URL.createObjectURL(image)} alt="panel-img" className={styles.image} />
        </>
      )}
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  imageConfigurationField: css({
    flex: 1,
  }),
  image: css({
    maxWidth: '100%',
    width: 'max-content',
  }),
  imageLoadingContainer: css({
    maxWidth: '100%',
    height: 362,
    border: `1px solid ${theme.components.input.borderColor}`,
    padding: theme.spacing(1),
  }),
});
