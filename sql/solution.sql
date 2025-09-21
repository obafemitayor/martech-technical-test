-- This SQL script calculates the:
-- 1. LTV (Lifetime Value) per Campaign within 7 days after users install from the campaign
-- 2. ROAS (Return on Ad Spend) per campaign within 7 days after users install from the campaign
-- 3. Top 3 countries with the highest ROAS (Return on Ad Spend) within 7 days after campaign installation

-- The queries in the FINAL OUTPUTS section can only be executed one at a time. So if you want to execute 
-- one, then you need to comment the other two.

-- Helper table to simulate 0–6 day offsets
WITH RECURSIVE numbers(n) AS (
  SELECT 0
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 6
),

-- Step 1: Get all purchases made within 7 days after users installed from the campaigns
user_d7_purchases AS (
  SELECT
    i.user_id,
    i.campaign_id,
    i.country,
    i.install_ts,
    p.value
  FROM installs i
  LEFT JOIN purchases p 
    ON i.user_id = p.user_id 
   AND p.event_ts >= i.install_ts
   AND p.event_ts < DATETIME(i.install_ts, '+7 days')
),

-- Step 2: Get the total revenue and number of users for each campaign
revenue_per_campaign AS (
  SELECT
    campaign_id,
    SUM(value) AS revenue_d7,
    COUNT(DISTINCT user_id) AS num_users
  FROM user_d7_purchases
  GROUP BY campaign_id
),

-- Step 3: Get the 7-day window for each campaign starting from users’ install dates
-- Use DISTINCT because some of these days can overlap between different installs
campaign_day_windows AS (
  SELECT DISTINCT
    i.campaign_id,
    DATE(i.install_ts, '+' || n || ' days') AS cost_date
  FROM installs i
  CROSS JOIN numbers
),

-- Step 4: Get the total ad cost for each campaign in its 7-day windows
ad_costs_d7_per_campaign AS (
  SELECT
    cdw.campaign_id,
    SUM(ac.cost) AS ad_cost_d7
  FROM campaign_day_windows cdw
  JOIN ad_costs ac
    ON ac.campaign_id = cdw.campaign_id
   AND ac.date = cdw.cost_date
  GROUP BY cdw.campaign_id
),

-- Step 5: Get the total 7-day revenue per country for each campaign
revenue_per_campaign_country AS (
  SELECT
    campaign_id,
    country,
    SUM(value) AS revenue_d7
  FROM user_d7_purchases
  GROUP BY campaign_id, country
),

-- Step 6: Get installs per country for each campaign  
-- Also include total installs per campaign to use for splitting ad costs later
installs_per_campaign_country AS (
  SELECT
    campaign_id,
    country,
    COUNT(DISTINCT user_id) AS installs,
    (SELECT COUNT(DISTINCT user_id) FROM installs i2 WHERE i2.campaign_id = i1.campaign_id) AS total_installs
  FROM installs i1
  GROUP BY campaign_id, country
),

-- Step 7: Get ad cost per country for each campaign (allocated by share of installs)
ad_costs_per_campaign_country AS (
  SELECT
    icc.campaign_id,
    icc.country,
    (CAST(icc.installs AS FLOAT) / NULLIF(icc.total_installs, 0)) * ac.ad_cost_d7 AS cost_allocated
  FROM installs_per_campaign_country icc
  JOIN ad_costs_d7_per_campaign ac ON icc.campaign_id = ac.campaign_id
),

-- Step 8: Get ROAS per country for each campaign
roas_per_country AS (
  SELECT
    r.country,
    r.campaign_id,
    r.revenue_d7,
    c.cost_allocated
  FROM revenue_per_campaign_country r
  JOIN ad_costs_per_campaign_country c
    ON r.campaign_id = c.campaign_id AND r.country = c.country
)

-- === FINAL OUTPUTS ===

-- Query 1: Get LTV (Lifetime Value) per Campaign within 7 days
SELECT
  campaign_id,
  revenue_d7 / NULLIF(num_users, 0) AS ltv_d7
FROM revenue_per_campaign;

-- Query 2: Get ROAS (Return on Ad Spend) per campaign within 7 days
SELECT
  r.campaign_id,
  r.revenue_d7 / NULLIF(a.ad_cost_d7, 0) AS roas_d7
FROM revenue_per_campaign r
JOIN ad_costs_d7_per_campaign a ON r.campaign_id = a.campaign_id;

-- Query 3: Get the Top 3 countries with the highest overall ROAS (Return on Ad Spend)
SELECT
  country,
  SUM(revenue_d7) * 1.0 / NULLIF(SUM(cost_allocated), 0) AS roas_d7
FROM roas_per_country
GROUP BY country
ORDER BY roas_d7 DESC
LIMIT 3;
