import { v4 as uuidv4 } from "uuid";
import { IExternalService } from "../interfaces/events.interfaces";
import {
  TransformedEventPayload,
  ExternalServiceResponse,
} from "../types/event.types";

class AdEventsXExternalService implements IExternalService {
  private possibleResponses = [
    { status: 200, message: "OK" },
    { status: 202, message: "Accepted" },
    { status: 400, message: "Bad Request" },
    { status: 401, message: "Unauthorized" },
    { status: 403, message: "Forbidden" },
    { status: 429, message: "Too Many Requests" },
    { status: 500, message: "Internal Server Error" },
    { status: 503, message: "Service Unavailable" },
  ];

  private simulateResponse(): Promise<ExternalServiceResponse> {
    const randomResponse =
      this.possibleResponses[
        Math.floor(Math.random() * this.possibleResponses.length)
      ];
    const isSuccess =
      randomResponse.status === 200 || randomResponse.status === 202;
    const responseMessage = {
      success: isSuccess,
      status: randomResponse.status,
      requestId: uuidv4(),
      message: randomResponse.message,
    };
    return isSuccess
      ? Promise.resolve(responseMessage)
      : Promise.reject(responseMessage);
  }

  public async sendRequest(
    url: string,
    payload: TransformedEventPayload,
  ): Promise<ExternalServiceResponse> {
    console.log("Payload: ", JSON.stringify(payload, null, 2));
    console.log("URL: ", url);
    return this.simulateResponse();
  }
}

export default new AdEventsXExternalService();
