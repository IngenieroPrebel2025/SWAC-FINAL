import { store } from "@/store";
import type {
  IAppointmentRepository,
  IAuditRepository,
  IAuthRepository,
  IDockRepository,
  IGateRepository,
  IIntegrationRepository,
  ISiteRepository,
  ISupplierRepository,
  IWorkflowRepository,
} from "./types";

import { MockSiteRepository } from "./mock/mockSiteRepository";
import { MockDockRepository } from "./mock/mockDockRepository";
import { MockSupplierRepository } from "./mock/mockSupplierRepository";
import { MockAppointmentRepository } from "./mock/mockAppointmentRepository";
import { MockIntegrationRepository } from "./mock/mockIntegrationRepository";
import { MockAuthRepository } from "./mock/mockAuthRepository";
import { MockWorkflowRepository } from "./mock/mockWorkflowRepository";
import { MockAuditRepository } from "./mock/mockAuditRepository";
import { MockGateRepository } from "./mock/mockGateRepository";

import { LiveSiteRepository } from "./live/liveSiteRepository";
import { LiveDockRepository } from "./live/liveDockRepository";
import { LiveSupplierRepository } from "./live/liveSupplierRepository";
import { LiveAppointmentRepository } from "./live/liveAppointmentRepository";
import { LiveIntegrationRepository } from "./live/liveIntegrationRepository";
import { LiveAuthRepository } from "./live/liveAuthRepository";
import { LiveWorkflowRepository } from "./live/liveWorkflowRepository";
import { LiveAuditRepository } from "./live/liveAuditRepository";
import { LiveGateRepository } from "./live/liveGateRepository";

const mock = {
  site: new MockSiteRepository(),
  dock: new MockDockRepository(),
  supplier: new MockSupplierRepository(),
  appointment: new MockAppointmentRepository(),
  integration: new MockIntegrationRepository(),
  auth: new MockAuthRepository(),
  workflow: new MockWorkflowRepository(),
  audit: new MockAuditRepository(),
  gate: new MockGateRepository(),
};

const live = {
  site: new LiveSiteRepository(),
  dock: new LiveDockRepository(),
  supplier: new LiveSupplierRepository(),
  appointment: new LiveAppointmentRepository(),
  integration: new LiveIntegrationRepository(),
  auth: new LiveAuthRepository(),
  workflow: new LiveWorkflowRepository(),
  audit: new LiveAuditRepository(),
  gate: new LiveGateRepository(),
};

const isMock = () => store.getState().systemConfig.dataSourceMode === "MOCK";

/**
 * Factory de repositorios: resuelve en cada acceso el adaptador activo
 * (MOCK en memoria o LIVE vía Axios) según `systemConfig.dataSourceMode`.
 */
export const repositories = {
  get siteRepo(): ISiteRepository {
    return isMock() ? mock.site : live.site;
  },
  get dockRepo(): IDockRepository {
    return isMock() ? mock.dock : live.dock;
  },
  get supplierRepo(): ISupplierRepository {
    return isMock() ? mock.supplier : live.supplier;
  },
  get appointmentRepo(): IAppointmentRepository {
    return isMock() ? mock.appointment : live.appointment;
  },
  get integrationRepo(): IIntegrationRepository {
    return isMock() ? mock.integration : live.integration;
  },
  get authRepo(): IAuthRepository {
    return isMock() ? mock.auth : live.auth;
  },
  get workflowRepo(): IWorkflowRepository {
    return isMock() ? mock.workflow : live.workflow;
  },
  get auditRepo(): IAuditRepository {
    return isMock() ? mock.audit : live.audit;
  },
  get gateRepo(): IGateRepository {
    return isMock() ? mock.gate : live.gate;
  },
};

export type * from "./types";
