import {
  ExternalServiceResponse,
  TransformedEventPayload,
} from "../types/event.types";

export interface IExternalService {
  sendRequest(
    url: string,
    payload: TransformedEventPayload,
  ): Promise<ExternalServiceResponse>;
}
