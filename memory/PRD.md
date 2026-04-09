# Diana's Pantry Plan - PRD

## Overview
A mobile-first household provisioning app that helps plan weekly grocery runs by combining saved household defaults, pantry/fridge/freezer inventory, required items, store preferences, meal needs, cooking style, dietary rules, exclusions, and budget.

## Architecture
- **Frontend**: Expo React Native (SDK 54) with file-based routing
- **Backend**: FastAPI (Python) on port 8001
- **Database**: MongoDB (local)
- **AI**: OpenAI GPT-5.2 via Emergent LLM key for meal plan generation and photo inventory extraction

## Core Features
1. **This Week** - Weekly planning form with trip type, budget, household size, preferred stores, meal coverage, cooking style, dietary rules, exclusions, price mode. Primary CTA "Build This Week's Plan" triggers AI generation.
2. **Inventory** - Manage pantry/fridge/freezer items. Add manually or via AI photo extraction.
3. **Lists** - Required items management + final generated grocery/household lists.
4. **Settings** - Persistent household defaults, weekly history, reset/duplicate.
5. **Plan Results** - Recipe cards, grouped grocery list, household items, budget summary. Edit/remove/replace recipes.

## API Endpoints
- `GET/PUT /api/profile` - Household profile CRUD
- `POST /api/profile/reset` - Reset to defaults
- `GET/POST/PUT/DELETE /api/inventory` - Inventory items CRUD
- `POST /api/inventory/batch` - Batch add items
- `POST /api/inventory/extract-photo` - AI photo extraction
- `GET/POST/PUT/DELETE /api/required-items` - Required items CRUD
- `POST /api/generate-plan` - AI meal plan generation
- `GET/PUT /api/current-plan` - Current plan management
- `DELETE /api/current-plan/recipe/{id}` - Remove recipe
- `POST /api/regenerate-recipe` - Replace single recipe
- `GET /api/history` - Plan history
- `POST /api/history/save` - Save to history
- `POST /api/history/{id}/duplicate` - Duplicate past week

## Default Profile
- Trip: Full week, Budget: $200
- Household: 4 adults, 1 child
- Stores: Walmart, Tractor Supply, Amazon, Sam's Club, Costco
- Meals: Breakfast, Lunch, Dinner, Snacks
- Style: Easy meals, Crockpot, One pan, Minimum effort

## Design
- Theme: Organic & Earthy (light)
- Colors: Forest green (#2C5530), terracotta accent (#C85A3C), warm bg (#F7F5F0)
- Touch-friendly, card-based, 44px+ touch targets
