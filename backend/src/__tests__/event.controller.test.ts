import request from "supertest";
import app from "../app";
import AdEventsXDummyApi from "../external-services/adeventsx-external-service";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

jest.mock("../external-services/adeventsx-external-service");

const mockedAdEventsXDummyApi = AdEventsXDummyApi.sendRequest as jest.Mock;
let token: string;

beforeAll(() => {
  const JWT_SECRET = process.env.JWT_SECRET || "default-secret";
  token = jwt.sign({ sub: "test-user" }, JWT_SECRET, { expiresIn: "1h" });
});

describe("POST /events with invalid request", () => {
  const baseEvent = {
    event_id: uuidv4(),
    user_id: "test-user-validation",
    event_name: "purchase",
    event_time: new Date().toISOString(),
    value: 100,
    campaign_id: "validation-campaign",
  };

  it.each([
    ["invalid event_id (not a uuid)", { ...baseEvent, event_id: "not-a-uuid" }],
    ["invalid event_name", { ...baseEvent, event_name: "invalid-event" }],
    [
      "invalid event_time (not an ISO string)",
      { ...baseEvent, event_time: "not-a-date" },
    ],
    ["missing user_id", { ...baseEvent, user_id: undefined }],
  ])("should return 400 for %s", async (testName, payload) => {
    const res = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual("Validation failed");
  });
});

describe("POST /events", () => {
  beforeEach(() => {
    mockedAdEventsXDummyApi.mockClear();
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const validEvent = {
      eventId: uuidv4(),
      userId: "test-user-456",
      eventName: "purchase",
      eventTime: new Date().toISOString(),
      value: 100,
      campaignId: "test-campaign",
    };
    const res = await request(app).post("/events").send(validEvent);
    expect(res.statusCode).toEqual(401);
  });

  it("should return 202 Accepted for a valid event and token", async () => {
    const validEvent = {
      eventId: uuidv4(),
      userId: "test-user-456",
      eventName: "purchase",
      eventTime: new Date().toISOString(),
      value: 100,
      campaignId: "test-campaign",
      source: "internal_martech",
      clickId: "test-click-id",
    };
    mockedAdEventsXDummyApi.mockResolvedValue({
      status: 202,
      requestId: "mock-success-id",
    });

    const res = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEvent);
    expect(res.statusCode).toEqual(202);
    expect(mockedAdEventsXDummyApi).toHaveBeenCalledTimes(1);
  });

  it("should not forward a duplicate event to the AdEventsX API within a 10-minute window", async () => {
    const eventId = uuidv4();
    const validEvent = {
      event_id: eventId,
      user_id: "idempotent-user",
      event_name: "lead",
      event_time: new Date().toISOString(),
      value: 50,
      campaign_id: "idempotent-campaign",
      source: "internal_martech",
      click_id: "test-click-id",
    };

    mockedAdEventsXDummyApi.mockResolvedValue({
      status: 202,
      requestId: "mock-idempotent-id",
    });

    const res1 = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEvent);
    expect(res1.statusCode).toEqual(202);
    expect(res1.body.data.status).toEqual("success");
    expect(mockedAdEventsXDummyApi).toHaveBeenCalledTimes(1);

    const res2 = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEvent);
    expect(res2.statusCode).toEqual(202);
    expect(res2.body.data.status).toEqual("duplicate");

    expect(mockedAdEventsXDummyApi).toHaveBeenCalledTimes(1);
  });

  it("should retry and succeed if the first attempt fails with a 503", async () => {
    const validEvent = {
      eventId: uuidv4(),
      userId: "test-user-456",
      eventName: "purchase",
      eventTime: new Date().toISOString(),
      value: 100,
      campaignId: "test-campaign",
      source: "internal_martech",
      clickId: "test-click-id",
    };
    mockedAdEventsXDummyApi
      .mockRejectedValueOnce({ status: 503, requestId: "mock-fail-id" })
      .mockResolvedValueOnce({ status: 202, requestId: "mock-success-id-2" });

    const res = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEvent);

    expect(res.statusCode).toEqual(202);
    expect(mockedAdEventsXDummyApi).toHaveBeenCalledTimes(2);
  });

  it("should not retry on a 400 Bad Request error", async () => {
    const validEvent = {
      eventId: uuidv4(),
      userId: "test-user-456",
      eventName: "purchase",
      eventTime: new Date().toISOString(),
      value: 100,
      campaignId: "test-campaign",
      source: "internal_martech",
      clickId: "test-click-id",
    };
    mockedAdEventsXDummyApi.mockRejectedValue({
      status: 400,
      requestId: "mock-fail-no-retry",
    });

    const res = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEvent);

    expect(res.statusCode).toEqual(500);
    expect(mockedAdEventsXDummyApi).toHaveBeenCalledTimes(1);
  });

  it("should return 500 if all retry attempts fail", async () => {
    const validEvent = {
      eventId: uuidv4(),
      userId: "test-user-456",
      eventName: "purchase",
      eventTime: new Date().toISOString(),
      value: 100,
      campaignId: "test-campaign",
      source: "internal_martech",
      clickId: "test-click-id",
    };
    mockedAdEventsXDummyApi.mockRejectedValue({
      status: 503,
      requestId: "mock-fail-id-all",
    });

    const res = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEvent);

    expect(res.statusCode).toEqual(500);
    // The number of calls will be MAX_RETRIES (1 initial + 3 retries)
    expect(mockedAdEventsXDummyApi).toHaveBeenCalledTimes(4);
  }, 60000);
});
