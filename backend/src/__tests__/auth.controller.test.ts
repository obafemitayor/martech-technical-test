import request from "supertest";
import app from "../app";

describe("POST /auth/token", () => {
  it("should generate a token for a valid clientId", async () => {
    const res = await request(app)
      .post("/auth/token")
      .send({ clientId: "marketing-dashboard" });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("access_token");
  });

  it("should return 400 for an invalid clientId", async () => {
    const res = await request(app)
      .post("/auth/token")
      .send({ clientId: "invalid-client" });
    expect(res.statusCode).toEqual(400);
  });

  it("should return 400 for a missing clientId", async () => {
    const res = await request(app).post("/auth/token").send({});
    expect(res.statusCode).toEqual(400);
  });
});
