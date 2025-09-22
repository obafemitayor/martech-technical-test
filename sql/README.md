# Campaign Performance Analysis

## Introduction
This SQL script is used to get the **LTV (Lifetime Value)**, **ROAS (Return on Ad Spend)**, and the **Top 3 countries with the highest overall ROAS** of campaigns in the database.  
The goal is to understand how much value each campaign generates from users within 7 days, and how that compares against the money spent on ads.

---

## Prerequisite

### Campaigns
A campaign is simply a marketing effort to get users to install the app.  
Each campaign costs money (ad spend) and brings in new users (installs). We want to know if the money spent on the campaign was worth it.

### LTV
LTV (Lifetime Value) tells us how much revenue, on average, one user brought in during their first 7 days.  
👉 Formula: **Total revenue ÷ Number of users**

### ROAS
ROAS (Return on Ad Spend) tells us how much revenue was earned for every 1 unit of money spent on ads.  
👉 Formula: **Total revenue ÷ Total ad cost**

---

## Data Structure

We used 3 tables:

### Installs
Stores each user who installed the app, which campaign they came from, what country they are in, and when they installed.  
**Columns:**  
- user_id  
- campaign_id  
- country  
- install_ts  

### Purchases
Stores purchases made by users, when they made them, and how much they spent.  
**Columns:**  
- user_id  
- event_ts  
- value  

### Ad Costs
Stores how much money was spent per campaign per day.  
**Columns:**  
- campaign_id  
- date  
- cost  

---

## Sample Data

### Installs
| user_id | campaign_id | country | install_ts          |
|---------|-------------|---------|---------------------|
| u1      | c1          | US      | 2025-09-19 10:00:00 |
| u2      | c1          | US      | 2025-09-21 12:00:00 |
| u3      | c1          | CA      | 2025-09-21 15:00:00 |
| u4      | c2          | UK      | 2025-09-20 09:00:00 |

### Purchases
| user_id | event_ts           | value |
|---------|--------------------|-------|
| u1      | 2025-09-20 11:00:00 | 50    |
| u2      | 2025-09-22 14:00:00 | 30    |
| u3      | 2025-09-22 16:00:00 | 20    |
| u4      | 2025-09-21 10:00:00 | 40    |

### Ad Costs
| campaign_id | date       | cost |
|-------------|------------|------|
| c1          | 2025-09-19 | 100  |
| c1          | 2025-09-20 | 100  |
| c1          | 2025-09-21 | 150  |
| c1          | 2025-09-22 | 100  |
| c1          | 2025-09-23 | 100  |
| c1          | 2025-09-24 | 150  |
| c1          | 2025-09-25 | 100  |
| c1          | 2025-09-26 | 100  |
| c1          | 2025-09-27 | 100  |
| c2          | 2025-09-20 | 60   |
| c2          | 2025-09-21 | 90   |
| c2          | 2025-09-22 | 60   |
| c2          | 2025-09-23 | 60   |
| c2          | 2025-09-24 | 90   |
| c2          | 2025-09-25 | 60   |
| c2          | 2025-09-26 | 60   |

---

## How the Results Are Calculated

### 1. LTV per Campaign
**What is LTV?**  
It’s the average money each user spent in the first 7 days after installing.  

**How we calculate it:**  
- Find the total revenue (all money spent by users from the campaign within 7 days of installing).  
- Divide by the number of users in the campaign.  

**Example with our data:**  
- Campaign **c1**:  
  - Users u1 (50) + u2 (30) + u3 (20) = **100**  
  - Total users = 3  
  - LTV = 100 ÷ 3 = **33.33**  
- Campaign **c2**:  
  - User u4 = **40**  
  - Total users = 1  
  - LTV = 40 ÷ 1 = **40**  

✅ **Output**
| campaign_id | ltv_d7  |
|-------------|---------|
| c1          | 33.33   |
| c2          | 40.00   |

---

### 2. ROAS per Campaign
**What is ROAS?**  
It shows how much money came back for every 1 unit of ad money spent.  

**How we calculate it:**  
- Find the total revenue (all money spent by users from the campaign within 7 days of installing).  
- Add up how much was spent on ads in those 7 days (cost).  
- Divide revenue by cost.  

**Example with our data:**  
- Campaign **c1**:  
  - Revenue = 100  
  - Cost = 1050  
  - ROAS = 100 ÷ 1050 = **0.10**  
- Campaign **c2**:  
  - Revenue = 40  
  - Cost = 480  
  - ROAS = 40 ÷ 480 = **0.0833**  

✅ **Output**
| campaign_id | roas_d7 |
|-------------|---------|
| c1          | 0.10    |
| c2          | 0.0833  |

---

### 3. Top 3 Countries by ROAS
**Why this?**  
We also want to see which countries gave the best return after splitting the ad spend fairly.  

**How we calculate it:**  
1. Split each campaign’s ad cost across countries based on how many installs came from each country.  
2. Add up revenue by country.  
3. Divide each country’s revenue by its share of ad cost.  

**Example with our data:**  
- Campaign **c1** had 3 installs (US: 2, CA: 1).  
  - Cost = 1050 → US gets 700, CA gets 350.  
- Campaign **c2** had 1 install (UK: 1).  
  - Cost = 480 → UK gets 480.  

Now compare revenue vs cost:  
- US: Revenue 80 ÷ Cost 700 = **0.12**  
- CA: Revenue 20 ÷ Cost 350 = **0.06**  
- UK: Revenue 40 ÷ Cost 480 = **0.0833**  

✅ **Output**
| country | roas_d7 |
|---------|---------|
| US      | 0.12    |
| UK      | 0.0833  |
| CA      | 0.06    |

---

---

## Assumptions

### How the calculation of the total money spent on ads was gotten i.e ad_costs_d7_per_campaign

To get the total money spent on ads, we need to sum up the costs for each day in a 7-day window starting from when a user installs from a campaign. Seems pretty straight forward if it was one install per campaign, but because multiple users can install from a campaign, then there is a possibility users installation days can overlap with each other.

This then leaves an ambiguity in the requirement on whether the adcost for an overlapping day should be counted once, or if it should be counted again for each overlapping user.

For this solution, I have chosen to count the adcost for an overlapping day once.

Example:

Imagine a campaign where a user installs on Day 1. The challenge requires us to sum the ad costs for the next 7 days (Day 1 to Day 7).
Now, imagine another user from the same campaign installs on Day 3. For this user, we must sum the ad costs from Day 3 to Day 9.
If we are not careful, we might calculate the costs for the first user (Days 1-7) and add them to the costs for the second user (Days 3-9).

If we did that, we would double-count the ad costs for the overlapping days (Days 3, 4, 5, 6, and 7). This would incorrectly inflate our total ad spend and give us an artificially low ROAS.

---

You can find screenshots of all the query outputs in the **screenshots** folder.  
These screenshots illustrate the explanations above and allows you to cross-check the results step by step.  
