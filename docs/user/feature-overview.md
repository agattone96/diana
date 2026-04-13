# Feature Overview

## Accounts and sessions

- Create an account and log in.
- The app stores a session token locally and sends it as a Bearer token to the backend.

## Household defaults (profile)

Set reusable defaults used for weekly planning:
- household size, budget, trip type
- preferred stores
- meal coverage and cooking styles
- dietary rules, exclusions, planning instructions

## Inventory (pantry/fridge/freezer)

- Track what you already have.
- Items include quantity/unit and a location (pantry, fridge, freezer).
- Optional: extract items from a photo (if enabled).

## Required items

Track staples and must-buy items (grocery or household) that should be included in the shopping list.

## Weekly plan generation

Generate a weekly plan that includes:
- recipe cards with ingredients
- a grouped “to buy” list derived from inventory + required items + plan output

## Plan editing

- Remove a recipe
- Request a replacement recipe with a preference (server-side AI)

## History

- Save a plan to history
- Duplicate a previous week

