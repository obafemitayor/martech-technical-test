import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authTokenSchema } from "../validation-schemas/auth.schema";

const JWT_SECRET = process.env.JWT_SECRET!;
class AuthController {
  public generateToken(req: Request, res: Response): void {
    const { error, value } = authTokenSchema.validate(req.body);
    if (error) {
      res
        .status(400)
        .json({ message: "Validation failed", errors: error.details });
      return;
    }

    const payload = {
      iss: "event-api",
      sub: value.clientId,
    };
    const token = jwt.sign(payload, JWT_SECRET as string, { expiresIn: "1h" });
    res
      .status(200)
      .json({ access_token: token, token_type: "Bearer", expires_in: 3600 });
  }
}

export default new AuthController();
