import { EventPayload, TransformedEventPayload } from "../types/event.types";
import { IExternalService } from "../interfaces/events.interfaces";
import AdEventsXExternalService from "../external-services/adeventsx-external-service";

const MAX_RETRIES = 3;

const ATTEMPT_TO_WORD_MAP: { [key: number]: string } = {
  0: "first",
  1: "second",
  2: "third",
  3: "fourth",
};

const API_URL = "https://api.adeventsx.example/v1/conversions";

class EventService {
  private externalService: IExternalService;
  private cache: Map<string, number>;

  constructor() {
    this.externalService = AdEventsXExternalService;
    this.cache = new Map();
  }

  private transformPayload(payload: EventPayload): TransformedEventPayload {
    return {
      id: payload.eventId,
      user: payload.userId,
      name: payload.eventName,
      ts: Math.floor(new Date(payload.eventTime).getTime() / 1000),
      valueCents: Math.round(payload.value * 100),
      campaign: payload.campaignId,
      source: "internal_martech",
    };
  }

  private isEventInCache(eventId: string): boolean {
    const eventTime = this.cache.get(eventId);
    if (!eventTime) {
      return false;
    }
    if (Date.now() - eventTime > 600000) {
      this.cache.delete(eventId);
      return false;
    }
    return true;
  }

  private addEventToCache(eventId: string): void {
    this.cache.set(eventId, Date.now());
  }

  private async sendEventToExternalApi(
    payload: TransformedEventPayload,
    attempt: number,
  ): Promise<void> {
    const attemptToWord = ATTEMPT_TO_WORD_MAP[attempt];
    const start = Date.now();
    const response = await this.externalService.sendRequest(API_URL, payload);
    const latency = Date.now() - start;
    console.log(
      `[${payload.id}] Successfully forwarded on the ${attemptToWord} attempt with status ${response.status}. Request ID: ${response.requestId} (latency: ${latency}ms)`,
    );
  }

  private async handleErrorFromExternalApi(
    error: any,
    event_id: string,
    currentAttempts: number,
  ): Promise<void> {
    const status = error.status;
    console.log(
      `[Request failed with status: ${status}. Request ID: ${error.requestId}`,
    );
    const shouldRetry = status === 429 || (status >= 500 && status < 600);
    if (!shouldRetry) {
      throw error;
    }

    console.log(`[${event_id}] Retrying... Attempt ${currentAttempts}`);
    const delay = Math.pow(2, currentAttempts) * 1000;
    await new Promise((res) => setTimeout(res, delay));
  }

  private async forwardEventToAPI(
    payload: TransformedEventPayload,
  ): Promise<void> {
    let attempts = 0;
    while (attempts < MAX_RETRIES) {
      try {
        await this.sendEventToExternalApi(payload, attempts);
        return;
      } catch (error: any) {
        attempts++;
        await this.handleErrorFromExternalApi(error, payload.id, attempts);
      }
    }
    throw new Error("Max retries reached. Event processing failed.");
  }

  public async processEvent(payload: EventPayload): Promise<any> {
    if (this.isEventInCache(payload.eventId)) {
      console.log(`[${payload.eventId}] Event is a duplicate. Skipping.`);
      return { status: "duplicate" };
    }

    this.addEventToCache(payload.eventId);
    const transformedPayload = this.transformPayload(payload);
    await this.forwardEventToAPI(transformedPayload);
    return { status: "success" };
  }
}

export default new EventService();
