export interface EventPayload {
  eventId: string;
  userId: string;
  eventName: "purchase" | "lead";
  eventTime: string;
  value: number;
  campaignId: string;
  source: string;
  clickId: string;
}

export type ExternalServiceResponse = {
  success: boolean;
  status: number;
  requestId?: string;
  message: string;
};

export interface TransformedEventPayload {
  id: string;
  user: string;
  name: string;
  ts: number;
  valueCents: number;
  campaign: string;
  source: string;
}
