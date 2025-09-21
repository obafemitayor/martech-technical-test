import Joi from "joi";

const validClients = [
  "marketing-dashboard",
  "analytics-pipeline",
  "mobile-app",
];

export const authTokenSchema = Joi.object({
  clientId: Joi.string()
    .valid(...validClients)
    .required(),
});
