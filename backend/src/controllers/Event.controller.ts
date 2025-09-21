import { Request, Response } from "express";
import EventService from "../services/Event.service";
import { EventPayload } from "../types/event.types";
import { eventValidationSchema } from "../validation-schemas/event.schema";

class EventController {
  public async handleEvent(req: Request, res: Response): Promise<void> {
    const { error, value } = eventValidationSchema.validate(req.body);
    if (error) {
      res
        .status(400)
        .json({ message: "Validation failed", errors: error.details });
      return;
    }

    const eventPayload: EventPayload = value;
    try {
      const result = await EventService.processEvent(eventPayload);
      res
        .status(202)
        .json({ message: "Event accepted for processing", data: result });
    } catch (error: any) {
      console.error(`[${eventPayload.eventId}] Error processing event:`, error);
      res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  }
}

export default new EventController();
