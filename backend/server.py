from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'pantry_plan')]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Pydantic Models ─────────────────────────────────────

class HouseholdProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_type: str = "Full week"
    budget: float = 200.0
    adults: int = 4
    children: int = 1
    preferred_stores: List[str] = Field(default_factory=lambda: ["Walmart", "Tractor Supply", "Amazon", "Sam's Club", "Costco"])
    meal_coverage: List[str] = Field(default_factory=lambda: ["Breakfast", "Lunch", "Dinner", "Snacks"])
    cooking_style: List[str] = Field(default_factory=lambda: ["Easy meals", "Crockpot", "One pan", "Minimum effort"])
    dietary_rules: List[str] = Field(default_factory=list)
    exclusions: str = ""
    price_mode: str = "No prices"
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProfileUpdate(BaseModel):
    trip_type: Optional[str] = None
    budget: Optional[float] = None
    adults: Optional[int] = None
    children: Optional[int] = None
    preferred_stores: Optional[List[str]] = None
    meal_coverage: Optional[List[str]] = None
    cooking_style: Optional[List[str]] = None
    dietary_rules: Optional[List[str]] = None
    exclusions: Optional[str] = None
    price_mode: Optional[str] = None

class InventoryItemCreate(BaseModel):
    name: str
    quantity: float = 1
    unit: str = ""
    location: str = "pantry"

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    location: Optional[str] = None

class RequiredItemCreate(BaseModel):
    name: str
    quantity: float = 1
    unit: str = ""
    note: str = ""
    category: str = "grocery"

class RequiredItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    note: Optional[str] = None
    category: Optional[str] = None

class PhotoExtractRequest(BaseModel):
    image_base64: str
    location: str = "pantry"

class GeneratePlanRequest(BaseModel):
    trip_type: Optional[str] = None
    budget: Optional[float] = None
    adults: Optional[int] = None
    children: Optional[int] = None
    preferred_stores: Optional[List[str]] = None
    meal_coverage: Optional[List[str]] = None
    cooking_style: Optional[List[str]] = None
    dietary_rules: Optional[List[str]] = None
    exclusions: Optional[str] = None
    price_mode: Optional[str] = None

class UpdatePlanBody(BaseModel):
    plan: dict

class RegenerateRecipeRequest(BaseModel):
    recipe_id: str
    preference: str = "similar"

# ─── Profile Endpoints ───────────────────────────────────

@api_router.get("/profile")
async def get_profile():
    profile = await db.household_profiles.find_one({}, {"_id": 0})
    if not profile:
        default = HouseholdProfile()
        d = default.dict()
        await db.household_profiles.insert_one(d.copy())
        return d
    return profile

@api_router.put("/profile")
async def update_profile(update: ProfileUpdate):
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    existing = await db.household_profiles.find_one({})
    if not existing:
        default_data = HouseholdProfile(**update_data).dict()
        await db.household_profiles.insert_one(default_data.copy())
        default_data.pop("_id", None)
        return default_data
    await db.household_profiles.update_one({"_id": existing["_id"]}, {"$set": update_data})
    updated = await db.household_profiles.find_one({}, {"_id": 0})
    return updated

@api_router.post("/profile/reset")
async def reset_profile():
    await db.household_profiles.delete_many({})
    default = HouseholdProfile()
    d = default.dict()
    await db.household_profiles.insert_one(d.copy())
    return d

# ─── Inventory Endpoints ─────────────────────────────────

@api_router.get("/inventory")
async def get_inventory(location: Optional[str] = None):
    query = {}
    if location:
        query["location"] = location
    items = await db.inventory_items.find(query, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/inventory")
async def add_inventory_item(item: InventoryItemCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "name": item.name,
        "quantity": item.quantity,
        "unit": item.unit,
        "location": item.location,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.inventory_items.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc

@api_router.post("/inventory/batch")
async def add_inventory_batch(items: List[InventoryItemCreate]):
    results = []
    for item in items:
        doc = {
            "id": str(uuid.uuid4()),
            "name": item.name,
            "quantity": item.quantity,
            "unit": item.unit,
            "location": item.location,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.inventory_items.insert_one(doc.copy())
        doc.pop("_id", None)
        results.append(doc)
    return results

@api_router.put("/inventory/{item_id}")
async def update_inventory_item(item_id: str, update: InventoryItemUpdate):
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    result = await db.inventory_items.update_one({"id": item_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    item = await db.inventory_items.find_one({"id": item_id}, {"_id": 0})
    return item

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str):
    result = await db.inventory_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True}

# ─── Photo Extraction ────────────────────────────────────

@api_router.post("/inventory/extract-photo")
async def extract_photo(req: PhotoExtractRequest):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI key not configured")

        chat = LlmChat(
            api_key=api_key,
            session_id=f"photo-{uuid.uuid4()}",
            system_message="You are an inventory scanner. Given a photo of a pantry, fridge, or freezer, identify all visible food and household items. Return ONLY a valid JSON array of objects with keys: name (string), quantity (number estimate), unit (string like 'bottles', 'bags', 'boxes', 'lbs', 'items', 'cans'). No extra text."
        ).with_model("openai", "gpt-5.2")

        image_content = ImageContent(image_base64=req.image_base64)
        user_msg = UserMessage(
            text=f"List every item visible in this {req.location} photo as a JSON array.",
            file_contents=[image_content]
        )
        response = await chat.send_message(user_msg)

        text = response.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            end = -1 if lines[-1].strip().startswith("```") else len(lines)
            text = "\n".join(lines[1:end])

        items_raw = json.loads(text)
        extracted = []
        for it in items_raw:
            extracted.append({
                "id": str(uuid.uuid4()),
                "name": it.get("name", "Unknown"),
                "quantity": float(it.get("quantity", 1)),
                "unit": it.get("unit", ""),
                "location": req.location
            })
        return {"items": extracted}

    except json.JSONDecodeError:
        logger.error("Failed to parse AI photo response")
        raise HTTPException(status_code=500, detail="Failed to parse extracted items from photo")
    except Exception as e:
        logger.error(f"Photo extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── Required Items ──────────────────────────────────────

@api_router.get("/required-items")
async def get_required_items():
    return await db.required_items.find({}, {"_id": 0}).to_list(1000)

@api_router.post("/required-items")
async def add_required_item(item: RequiredItemCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "name": item.name,
        "quantity": item.quantity,
        "unit": item.unit,
        "note": item.note,
        "category": item.category,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.required_items.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc

@api_router.put("/required-items/{item_id}")
async def update_required_item(item_id: str, update: RequiredItemUpdate):
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    result = await db.required_items.update_one({"id": item_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    item = await db.required_items.find_one({"id": item_id}, {"_id": 0})
    return item

@api_router.delete("/required-items/{item_id}")
async def delete_required_item(item_id: str):
    result = await db.required_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True}

# ─── Plan Generation ─────────────────────────────────────

PLANNER_SYSTEM_PROMPT = """You are the planning engine for Diana's Pantry Plan.

ROLE
You generate a practical weekly household meal and shopping plan based on structured household inputs. You are not a chatbot and you do not return conversational fluff. You return structured planning output only.

GOAL
Given household defaults, weekly preferences, current inventory, required items, store preferences, and budget, generate:
- 3 to 7 realistic recipe ideas
- ingredients for each recipe
- what is already on hand
- what must be purchased
- one merged grocery list grouped by section
- household supply items
- optional price estimates
- cheaper substitutions when requested
- minimum-effort recommendations

PRIORITIES
1. Prefer easy realistic meals
2. Strongly favor minimum effort
3. Favor crockpot, one-pan, sheet pan, batchable, and low-cleanup meals
4. Reuse ingredients across meals
5. Reduce waste
6. Avoid duplicate purchases
7. Use pantry/fridge/freezer inventory first
8. Stay within budget when possible
9. Suggest cheaper substitutions when needed
10. Keep meals household-friendly and practical

AVOID
- vague meal inspiration
- overly complex meals
- niche ingredients unless necessary
- duplicate ingredients under slightly different names
- output that is hard to edit
- conversational filler

REQUIRED LOGIC
- Generate 3 to 7 meals that fit household size and meal preferences
- Match meals to effort preference and cooking style
- Use overlapping ingredients where possible
- Flag inventory matches
- Separate on-hand items from must-buy items
- Merge duplicate grocery items into a consolidated shopping list
- Keep household supply items in a separate list
- If price mode is cheap-first, bias toward lower-cost meals and substitutions
- If price mode is estimated-prices, return rough estimates by item and total
- Respect exclusions, allergies, and diet rules strictly

RECIPE OUTPUT REQUIREMENTS
For each recipe include:
- id (string uuid)
- name
- short reasonChosen
- servings
- effortLevel (low, medium, or high)
- cookMethod
- mealType (breakfast, lunch, dinner, or snack)
- ingredients array

Each ingredient should include:
- name
- quantity (number)
- unit
- section (produce, meat, dairy, frozen, pantry, snacks, beverages, household, misc)
- onHand (boolean)
- mustBuy (boolean)
- optionalSubstitution (string or null)
- estimatedPrice (number or null)

MERGED GROCERY LIST RULES
- group by section
- merge duplicates
- normalize naming
- include quantity and unit where possible
- mark whether item was required by recipe, user-required list, or both

HOUSEHOLD LIST RULES
- keep household items separate from groceries
- preserve user-added required household items

RESPONSE FORMAT
Return valid JSON only. No markdown, no backticks, no explanation.

JSON SHAPE
{
  "selectedRecipes": [
    {
      "id": "string",
      "name": "string",
      "reasonChosen": "string",
      "servings": number,
      "effortLevel": "low | medium | high",
      "cookMethod": "string",
      "mealType": "breakfast | lunch | dinner | snack",
      "ingredients": [
        {
          "name": "string",
          "quantity": number,
          "unit": "string",
          "section": "produce | meat | dairy | frozen | pantry | snacks | beverages | household | misc",
          "onHand": boolean,
          "mustBuy": boolean,
          "optionalSubstitution": "string or null",
          "estimatedPrice": null
        }
      ]
    }
  ],
  "pantryMatches": [
    {
      "itemName": "string",
      "usedInRecipes": ["recipe id"],
      "quantityUsed": "string"
    }
  ],
  "itemsToPurchase": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
      "section": "string",
      "source": "recipe | required | both",
      "estimatedPrice": null
    }
  ],
  "mergedGroceryListBySection": [
    {
      "section": "string",
      "items": [
        {
          "name": "string",
          "quantity": number,
          "unit": "string",
          "source": "recipe | required | both",
          "estimatedPrice": null,
          "cheapSwap": null
        }
      ]
    }
  ],
  "householdItems": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
      "note": "string or null",
      "estimatedPrice": null
    }
  ],
  "estimatedTotal": null,
  "substitutions": [
    {
      "original": "string",
      "substitute": "string",
      "reason": "string"
    }
  ],
  "notes": [
    "string"
  ]
}

QUALITY BAR
The plan must feel like something a real household would actually use this week."""

@api_router.post("/generate-plan")
async def generate_plan(req: GeneratePlanRequest):
    profile = await db.household_profiles.find_one({}, {"_id": 0})
    if not profile:
        profile = HouseholdProfile().dict()

    config = {**profile}
    for k, v in req.dict().items():
        if v is not None:
            config[k] = v

    inventory = await db.inventory_items.find({}, {"_id": 0}).to_list(1000)
    required = await db.required_items.find({}, {"_id": 0}).to_list(1000)

    ai_input = {
        "householdProfile": {
            "adults": config.get("adults", 4),
            "children": config.get("children", 1),
            "tripType": config.get("trip_type", "Full week")
        },
        "weeklyPreferences": {
            "mealCoverage": config.get("meal_coverage", []),
            "cookingStyle": config.get("cooking_style", [])
        },
        "inventoryItems": [
            {"name": i["name"], "quantity": i["quantity"], "unit": i.get("unit", ""), "location": i["location"]}
            for i in inventory
        ],
        "requiredItems": [
            {"name": r["name"], "quantity": r["quantity"], "unit": r.get("unit", ""), "category": r.get("category", "grocery")}
            for r in required
        ],
        "preferredStores": config.get("preferred_stores", []),
        "dietaryRules": config.get("dietary_rules", []),
        "exclusions": [e.strip() for e in config.get("exclusions", "").split(",") if e.strip()],
        "priceMode": config.get("price_mode", "No prices"),
        "budget": config.get("budget", 200)
    }

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI key not configured")

        chat = LlmChat(
            api_key=api_key,
            session_id=f"plan-{uuid.uuid4()}",
            system_message=PLANNER_SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")

        msg = UserMessage(
            text=f"Generate a weekly meal and shopping plan from this input. Return valid JSON only, no markdown.\n\n{json.dumps(ai_input, indent=2)}"
        )
        response = await chat.send_message(msg)

        text = response.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            end_idx = len(lines) - 1
            if lines[end_idx].strip().startswith("```"):
                text = "\n".join(lines[1:end_idx])
            else:
                text = "\n".join(lines[1:])

        plan_data = json.loads(text)

        plan_record = {
            "id": str(uuid.uuid4()),
            "plan": plan_data,
            "config": {k: v for k, v in config.items() if k not in ("_id",)},
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        await db.current_plan.delete_many({})
        await db.current_plan.insert_one(plan_record.copy())
        plan_record.pop("_id", None)
        return plan_record

    except json.JSONDecodeError:
        logger.error("Failed to parse AI plan response")
        raise HTTPException(status_code=500, detail="AI returned invalid format. Please try again.")
    except Exception as e:
        logger.error(f"Plan generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/current-plan")
async def get_current_plan():
    plan = await db.current_plan.find_one({}, {"_id": 0})
    if not plan:
        return {"plan": None}
    return plan

@api_router.put("/current-plan")
async def update_current_plan(body: UpdatePlanBody):
    existing = await db.current_plan.find_one({})
    if not existing:
        raise HTTPException(status_code=404, detail="No current plan")
    await db.current_plan.update_one({"_id": existing["_id"]}, {"$set": {"plan": body.plan}})
    updated = await db.current_plan.find_one({}, {"_id": 0})
    return updated

@api_router.delete("/current-plan/recipe/{recipe_id}")
async def remove_recipe(recipe_id: str):
    plan_doc = await db.current_plan.find_one({})
    if not plan_doc:
        raise HTTPException(status_code=404, detail="No current plan")
    plan = plan_doc.get("plan", {})
    recipes = plan.get("selectedRecipes", [])
    plan["selectedRecipes"] = [r for r in recipes if r.get("id") != recipe_id]
    await db.current_plan.update_one({"_id": plan_doc["_id"]}, {"$set": {"plan": plan}})
    result = await db.current_plan.find_one({}, {"_id": 0})
    return result

@api_router.post("/regenerate-recipe")
async def regenerate_recipe(req: RegenerateRecipeRequest):
    plan_doc = await db.current_plan.find_one({}, {"_id": 0})
    if not plan_doc or not plan_doc.get("plan"):
        raise HTTPException(status_code=404, detail="No current plan")

    plan = plan_doc["plan"]
    old_recipe = None
    for r in plan.get("selectedRecipes", []):
        if r.get("id") == req.recipe_id:
            old_recipe = r
            break
    if not old_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    config = plan_doc.get("config", {})
    inventory = await db.inventory_items.find({}, {"_id": 0}).to_list(1000)

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI key not configured")

        chat = LlmChat(
            api_key=api_key,
            session_id=f"regen-{uuid.uuid4()}",
            system_message="You are a recipe replacement engine. Given a recipe to replace and household context, generate ONE replacement recipe. Return valid JSON only matching this shape: {\"id\": \"new-uuid\", \"name\": \"...\", \"reasonChosen\": \"...\", \"servings\": N, \"effortLevel\": \"low|medium|high\", \"cookMethod\": \"...\", \"mealType\": \"...\", \"ingredients\": [{\"name\": \"...\", \"quantity\": N, \"unit\": \"...\", \"section\": \"...\", \"onHand\": bool, \"mustBuy\": bool, \"optionalSubstitution\": null, \"estimatedPrice\": null}]}"
        ).with_model("openai", "gpt-5.2")

        prompt = f"""Replace this recipe with a {req.preference} alternative:
Recipe to replace: {json.dumps(old_recipe)}
Household: {config.get('adults', 4)} adults, {config.get('children', 1)} child
Cooking style: {config.get('cooking_style', [])}
Dietary rules: {config.get('dietary_rules', [])}
Exclusions: {config.get('exclusions', '')}
Inventory on hand: {json.dumps([i['name'] for i in inventory[:20]])}
Return valid JSON only."""

        response = await chat.send_message(UserMessage(text=prompt))
        text = response.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            end_idx = len(lines) - 1
            if lines[end_idx].strip().startswith("```"):
                text = "\n".join(lines[1:end_idx])
            else:
                text = "\n".join(lines[1:])

        new_recipe = json.loads(text)
        new_recipe["id"] = str(uuid.uuid4())

        recipes = plan.get("selectedRecipes", [])
        plan["selectedRecipes"] = [new_recipe if r.get("id") == req.recipe_id else r for r in recipes]

        raw_doc = await db.current_plan.find_one({})
        await db.current_plan.update_one({"_id": raw_doc["_id"]}, {"$set": {"plan": plan}})
        updated = await db.current_plan.find_one({}, {"_id": 0})
        return updated

    except Exception as e:
        logger.error(f"Recipe regeneration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── History ─────────────────────────────────────────────

@api_router.get("/history")
async def get_history():
    return await db.weekly_history.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.post("/history/save")
async def save_to_history():
    plan = await db.current_plan.find_one({}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="No current plan to save")
    history_entry = {
        "id": str(uuid.uuid4()),
        "plan": plan.get("plan"),
        "config": plan.get("config"),
        "saved_at": datetime.now(timezone.utc).isoformat(),
        "created_at": plan.get("created_at")
    }
    await db.weekly_history.insert_one(history_entry.copy())
    history_entry.pop("_id", None)
    return history_entry

@api_router.post("/history/{history_id}/duplicate")
async def duplicate_from_history(history_id: str):
    entry = await db.weekly_history.find_one({"id": history_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    plan_record = {
        "id": str(uuid.uuid4()),
        "plan": entry.get("plan"),
        "config": entry.get("config"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.current_plan.delete_many({})
    await db.current_plan.insert_one(plan_record.copy())
    plan_record.pop("_id", None)
    return plan_record

# ─── App Setup ────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
