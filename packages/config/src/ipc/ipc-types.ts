export const WIDGET_IPC_CHANNEL = 'widget-manager';

export interface WidgetIpcPayload {
  action: string;
  payload?: unknown;
}
