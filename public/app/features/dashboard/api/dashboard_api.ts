import { DashboardV2Spec } from '@grafana/schema/dist/esm/schema/dashboard/v2alpha0/dashboard.gen';
import { DashboardDataDTO } from 'app/types';

import { LegacyDashboardAPI } from './legacy';
import { DashboardAPI } from './types';
import { getDashboardsApiVersion } from './utils';
import { K8sDashboardAPI } from './v0';
import { K8sDashboardV2APIStub } from './v2';

// Describes the dashboard DTO types per API version
export interface ApiVersionDTO {
  legacy: DashboardDataDTO;
  v0: DashboardDataDTO;
  // v1: DashboardDTO; TODO[schema]: enable v1 when available
  v2: DashboardV2Spec;
}

type DashboardAPIClients = Record<
  keyof ApiVersionDTO,
  DashboardAPI<DashboardDataDTO | DashboardV2Spec>
>;

let clients: Partial<DashboardAPIClients> | undefined;

export function setDashboardAPI(override: Partial<DashboardAPIClients> | undefined) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('dashboardAPI can be only overridden in test environment');
  }
  clients = override;
}

export function getDashboardAPI(): DashboardAPI<DashboardDataDTO | DashboardV2Spec> {
  if (!clients) {
    clients = {
      legacy: new LegacyDashboardAPI(),
      v0: new K8sDashboardAPI(),
      v2: new K8sDashboardV2APIStub(),
    };
  }

  const v = getDashboardsApiVersion();

  // console.log('Dashboard API version:', v);

  if (!clients[v]) {
    throw new Error(`Unknown Dashboard API version: ${v}`);
  }

  return clients[v];
}
