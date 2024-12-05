import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useScopes } from '@grafana/scenes';
import { Button, Drawer, IconButton, Spinner, useStyles2 } from '@grafana/ui';
import { useGrafana } from 'app/core/context/GrafanaContext';
import { t, Trans } from 'app/core/internationalization';

import { ScopesInput } from './internal/ScopesInput';
import { ScopesTree } from './internal/ScopesTree';
import { useScopesDashboardsService } from './useScopesDashboardsService';
import { useScopesSelectorService } from './useScopesSelectorService';

export const ScopesSelector = () => {
  const { chrome } = useGrafana();
  const chromeState = chrome.useState();
  const menuDockedAndOpen = !chromeState.chromeless && chromeState.megaMenuDocked && chromeState.megaMenuOpen;
  const styles = useStyles2(getStyles, menuDockedAndOpen);
  const scopes = useScopes();
  const scopesSelectorService = useScopesSelectorService();
  const scopesDashboardsService = useScopesDashboardsService();

  if (!scopes || !scopesSelectorService || !scopesDashboardsService || !scopes.state.isEnabled) {
    return null;
  }

  const {
    applyNewScopes,
    closePicker,
    dismissNewScopes,
    openPicker,
    removeAllScopes,
    state,
    toggleNodeSelect,
    updateNode,
  } = scopesSelectorService;
  const { state: scopesDashboardsState, toggleDrawer } = scopesDashboardsService;

  const dashboardsIconLabel = scopes.state.isReadOnly
    ? t('scopes.dashboards.toggle.disabled', 'Suggested dashboards list is disabled due to read only mode')
    : scopesDashboardsState.isOpened
      ? t('scopes.dashboards.toggle.collapse', 'Collapse suggested dashboards list')
      : t('scopes.dashboards.toggle..expand', 'Expand suggested dashboards list');

  return (
    <div className={styles.container}>
      <IconButton
        name="web-section-alt"
        className={styles.dashboards}
        aria-label={dashboardsIconLabel}
        tooltip={dashboardsIconLabel}
        data-testid="scopes-dashboards-expand"
        disabled={scopes.state.isReadOnly}
        onClick={toggleDrawer}
      />

      <ScopesInput
        nodes={state.nodes}
        scopes={state.selectedScopes}
        isDisabled={scopes.state.isReadOnly}
        isLoading={scopes.state.isLoading}
        onInputClick={openPicker}
        onRemoveAllClick={removeAllScopes}
      />

      {state.isOpened && (
        <Drawer
          title={t('scopes.selector.title', 'Select scopes')}
          size="sm"
          onClose={() => {
            closePicker();
            dismissNewScopes();
          }}
        >
          <div className={styles.drawerContainer}>
            <div className={styles.treeContainer}>
              {scopes.state.isLoading ? (
                <Spinner data-testid="scopes-selector-loading" />
              ) : (
                <ScopesTree
                  nodes={state.nodes}
                  nodePath={['']}
                  loadingNodeName={state.loadingNodeName}
                  scopes={state.treeScopes}
                  onNodeUpdate={updateNode}
                  onNodeSelectToggle={toggleNodeSelect}
                />
              )}
            </div>

            <div className={styles.buttonsContainer}>
              <Button
                variant="primary"
                data-testid="scopes-selector-apply"
                onClick={() => {
                  closePicker();
                  applyNewScopes();
                }}
              >
                <Trans i18nKey="scopes.selector.apply">Apply</Trans>
              </Button>
              <Button
                variant="secondary"
                data-testid="scopes-selector-cancel"
                onClick={() => {
                  closePicker();
                  dismissNewScopes();
                }}
              >
                <Trans i18nKey="scopes.selector.cancel">Cancel</Trans>
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, menuDockedAndOpen: boolean) => {
  return {
    container: css({
      display: 'flex',
      flexDirection: 'row',
      paddingLeft: menuDockedAndOpen ? theme.spacing(2) : 'unset',
      ...(!config.featureToggles.singleTopNav && {
        paddingLeft: theme.spacing(2),
        borderLeft: `1px solid ${theme.colors.border.weak}`,
      }),
    }),
    dashboards: css({
      color: theme.colors.text.secondary,
      marginRight: theme.spacing(2),

      '&:hover': css({
        color: theme.colors.text.primary,
      }),
    }),
    drawerContainer: css({
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }),
    treeContainer: css({
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '100%',
      overflowY: 'hidden',
      // Fix for top level search outline overflow due to scrollbars
      paddingLeft: theme.spacing(0.5),
    }),
    buttonsContainer: css({
      display: 'flex',
      gap: theme.spacing(1),
      marginTop: theme.spacing(8),
    }),
  };
};
