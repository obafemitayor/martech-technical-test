import Joi from "joi";
import { EventPayload } from "../types/event.types";

export const eventValidationSchema = Joi.object<EventPayload>({
  eventId: Joi.string().uuid().required(),
  userId: Joi.string().required(),
  eventName: Joi.string().valid("purchase", "lead").required(),
  eventTime: Joi.date().iso().required(),
  value: Joi.number().min(0).required(),
  campaignId: Joi.string().required(),
  source: Joi.string().required(),
  clickId: Joi.string().required(),
})
  .rename("event_id", "eventId")
  .rename("user_id", "userId")
  .rename("event_name", "eventName")
  .rename("event_time", "eventTime")
  .rename("campaign_id", "campaignId")
  .rename("click_id", "clickId");
