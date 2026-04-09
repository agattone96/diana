import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Header, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "pantry_plan")]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

DEFAULT_STORES = ["Walmart", "Tractor Supply", "Amazon", "Sam's Club", "Costco"]
DEFAULT_MEAL_COVERAGE = ["Breakfast", "Lunch", "Dinner", "Snacks"]
DEFAULT_COOKING_STYLES = ["Easy meals", "Crockpot", "One pan", "Minimum effort"]
DEFAULT_DIETARY_TAGS = ["Gluten free", "Dairy free", "Low carb", "Vegetarian"]
PUBLIC_OWNER_ID = "public"


@app.get("/health")
async def healthcheck():
    return {"ok": True}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def auth_error() -> HTTPException:
    return HTTPException(status_code=401, detail="Authentication required")


def normalize_list(values: Optional[List[str]]) -> List[str]:
    if not values:
        return []
    seen = set()
    result = []
    for raw in values:
        value = str(raw).strip()
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(value)
    return result


def combine_options(*groups: Optional[List[str]]) -> List[str]:
    merged: List[str] = []
    seen = set()
    for group in groups:
        for item in normalize_list(group):
            key = item.lower()
            if key in seen:
                continue
            seen.add(key)
            merged.append(item)
    return merged


def password_hash(password: str, salt: Optional[str] = None) -> str:
    actual_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), actual_salt.encode("utf-8"), 120000)
    return f"{actual_salt}${base64.b64encode(digest).decode('utf-8')}"


def verify_password(password: str, encoded: str) -> bool:
    salt, expected = encoded.split("$", 1)
    actual = password_hash(password, salt).split("$", 1)[1]
    return hmac.compare_digest(actual, expected)


async def get_session(authorization: Optional[str]) -> Optional[Dict[str, Any]]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "", 1).strip()
    if not token:
        return None
    session = await db.sessions.find_one({"token": token}, {"_id": 0})
    if not session:
        return None
    return session


async def require_session(authorization: Optional[str]) -> Dict[str, Any]:
    session = await get_session(authorization)
    if not session:
        raise auth_error()
    return session


def owner_filter(owner_id: str) -> Dict[str, Any]:
    return {"owner_id": owner_id}


def profile_defaults(name: str = "Household", email: Optional[str] = None) -> Dict[str, Any]:
    return HouseholdProfile(name=name, email=email).dict()


async def ensure_profile(owner_id: str, name: str = "Household", email: Optional[str] = None) -> Dict[str, Any]:
    profile = await db.household_profiles.find_one(owner_filter(owner_id), {"_id": 0})
    if profile:
        return profile
    doc = profile_defaults(name=name, email=email)
    doc["owner_id"] = owner_id
    await db.household_profiles.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc


async def current_owner_profile(authorization: Optional[str]) -> Dict[str, Any]:
    session = await get_session(authorization)
    if session:
        return await ensure_profile(session["user_id"], name=session.get("name", "Household"), email=session.get("email"))
    return await ensure_profile(PUBLIC_OWNER_ID)


def build_planner_input(config: Dict[str, Any], inventory: List[Dict[str, Any]], required: List[Dict[str, Any]], request_data: Dict[str, Any]) -> Dict[str, Any]:
    advanced = {
        "promptOverride": request_data.get("prompt_override") or config.get("planner_prompt_override", ""),
        "customInstructions": request_data.get("custom_instructions") or config.get("reusable_planning_instructions", ""),
        "householdContextOverride": request_data.get("household_context_override") or "",
        "inventoryContextOverride": request_data.get("inventory_context_override") or "",
        "requiredItemsContextOverride": request_data.get("required_items_context_override") or "",
        "planningNotes": request_data.get("planning_notes") or "",
        "customOptions": {
            "stores": combine_options(config.get("custom_store_options"), request_data.get("custom_store_options")),
            "mealCoverage": combine_options(config.get("custom_meal_coverage_options"), request_data.get("custom_meal_coverage_options")),
            "cookingStyles": combine_options(config.get("custom_cooking_style_options"), request_data.get("custom_cooking_style_options")),
            "dietaryTags": combine_options(config.get("custom_dietary_tags"), request_data.get("custom_dietary_tags")),
            "reusableExclusions": combine_options(config.get("reusable_exclusions"), request_data.get("reusable_exclusions")),
        },
    }

    return {
        "householdProfile": {
            "name": config.get("name", "Household"),
            "adults": config.get("adults", 4),
            "children": config.get("children", 1),
            "tripType": config.get("trip_type", "Full week"),
            "preferredStores": config.get("preferred_stores", []),
            "budget": config.get("budget", 200),
            "mealCoverage": config.get("meal_coverage", []),
            "cookingStyle": config.get("cooking_style", []),
            "dietaryRules": config.get("dietary_rules", []),
            "exclusions": config.get("exclusions", ""),
            "mealSummary": config.get("household_summary", ""),
        },
        "savedDefaults": {
            "customStoreOptions": config.get("custom_store_options", []),
            "customMealCoverageOptions": config.get("custom_meal_coverage_options", []),
            "customCookingStyleOptions": config.get("custom_cooking_style_options", []),
            "customDietaryTags": config.get("custom_dietary_tags", []),
            "reusableExclusions": config.get("reusable_exclusions", []),
            "reusablePlanningInstructions": config.get("reusable_planning_instructions", ""),
        },
        "weeklyPreferences": {
            "tripType": config.get("trip_type", "Full week"),
            "budget": config.get("budget", 200),
            "mealCoverage": config.get("meal_coverage", []),
            "cookingStyle": config.get("cooking_style", []),
            "priceMode": config.get("price_mode", "No prices"),
        },
        "inventoryItems": [
            {
                "name": item["name"],
                "quantity": item["quantity"],
                "unit": item.get("unit", ""),
                "location": item["location"],
            }
            for item in inventory
        ],
        "requiredItems": [
            {
                "name": item["name"],
                "quantity": item["quantity"],
                "unit": item.get("unit", ""),
                "category": item.get("category", "grocery"),
                "note": item.get("note", ""),
            }
            for item in required
        ],
        "advancedControls": advanced,
    }


def openai_text_from_response(data: Dict[str, Any]) -> str:
    if data.get("output_text"):
        return data["output_text"]
    chunks: List[str] = []
    for item in data.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and content.get("text"):
                chunks.append(content["text"])
    return "\n".join(chunks).strip()


def call_openai_responses(system_prompt: str, user_prompt: str, schema_name: str) -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

    body = {
        "model": os.environ.get("OPENAI_PLANNER_MODEL", "gpt-5.1"),
        "input": [
            {"role": "system", "content": [{"type": "input_text", "text": system_prompt}]},
            {"role": "user", "content": [{"type": "input_text", "text": user_prompt}]},
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": schema_name,
                "schema": {
                    "type": "object",
                    "additionalProperties": True,
                },
            }
        },
    }
    response = requests.post(
        "https://api.openai.com/v1/responses",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=body,
        timeout=90,
    )
    if not response.ok:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {response.text}")
    return openai_text_from_response(response.json())


async def call_emergent_chat(system_message: str, prompt: str, session_prefix: str) -> str:
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI key not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=f"{session_prefix}-{uuid.uuid4()}",
        system_message=system_message,
    ).with_model("openai", "gpt-5.2")

    return await chat.send_message(UserMessage(text=prompt))


async def generate_plan_with_provider(system_prompt: str, ai_input: Dict[str, Any]) -> Dict[str, Any]:
    prompt = (
        "Generate a weekly meal and shopping plan from this input. Return valid JSON only, no markdown.\n\n"
        f"{json.dumps(ai_input, indent=2)}"
    )
    response_text = ""
    if os.environ.get("OPENAI_API_KEY"):
        response_text = call_openai_responses(system_prompt, prompt, "pantry_plan")
    else:
        response_text = await call_emergent_chat(system_prompt, prompt, "plan")

    text = response_text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        end_idx = len(lines) - 1
        text = "\n".join(lines[1:end_idx]) if lines[end_idx].strip().startswith("```") else "\n".join(lines[1:])
    return json.loads(text)


async def generate_recipe_replacement(old_recipe: Dict[str, Any], config: Dict[str, Any], inventory: List[Dict[str, Any]], preference: str) -> Dict[str, Any]:
    system_prompt = (
        "You are a recipe replacement engine. Given a recipe to replace and household context, "
        "generate ONE replacement recipe. Return valid JSON only matching this shape: "
        "{\"id\": \"new-uuid\", \"name\": \"...\", \"reasonChosen\": \"...\", \"servings\": N, "
        "\"effortLevel\": \"low|medium|high\", \"cookMethod\": \"...\", \"mealType\": \"...\", "
        "\"ingredients\": [{\"name\": \"...\", \"quantity\": N, \"unit\": \"...\", \"section\": \"...\", "
        "\"onHand\": bool, \"mustBuy\": bool, \"optionalSubstitution\": null, \"estimatedPrice\": null}]}"
    )
    prompt = (
        f"Replace this recipe with a {preference} alternative:\n"
        f"Recipe to replace: {json.dumps(old_recipe)}\n"
        f"Household: {config.get('adults', 4)} adults, {config.get('children', 1)} children\n"
        f"Cooking style: {json.dumps(config.get('cooking_style', []))}\n"
        f"Dietary rules: {json.dumps(config.get('dietary_rules', []))}\n"
        f"Exclusions: {config.get('exclusions', '')}\n"
        f"Inventory on hand: {json.dumps([i['name'] for i in inventory[:30]])}\n"
        "Return valid JSON only."
    )
    response_text = ""
    if os.environ.get("OPENAI_API_KEY"):
        response_text = call_openai_responses(system_prompt, prompt, "recipe_replacement")
    else:
        response_text = await call_emergent_chat(system_prompt, prompt, "regen")

    text = response_text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        end_idx = len(lines) - 1
        text = "\n".join(lines[1:end_idx]) if lines[end_idx].strip().startswith("```") else "\n".join(lines[1:])
    recipe = json.loads(text)
    recipe["id"] = str(uuid.uuid4())
    return recipe


class AuthRequest(BaseModel):
    name: Optional[str] = None
    email: str
    password: str


class HouseholdProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Household"
    email: Optional[str] = None
    trip_type: str = "Full week"
    budget: float = 200.0
    adults: int = 4
    children: int = 1
    preferred_stores: List[str] = Field(default_factory=lambda: DEFAULT_STORES.copy())
    meal_coverage: List[str] = Field(default_factory=lambda: DEFAULT_MEAL_COVERAGE.copy())
    cooking_style: List[str] = Field(default_factory=lambda: DEFAULT_COOKING_STYLES.copy())
    dietary_rules: List[str] = Field(default_factory=list)
    exclusions: str = ""
    price_mode: str = "No prices"
    household_summary: str = ""
    reusable_planning_instructions: str = ""
    custom_store_options: List[str] = Field(default_factory=list)
    custom_meal_coverage_options: List[str] = Field(default_factory=list)
    custom_cooking_style_options: List[str] = Field(default_factory=list)
    custom_dietary_tags: List[str] = Field(default_factory=list)
    reusable_exclusions: List[str] = Field(default_factory=list)
    planner_prompt_override: str = ""
    onboarding_completed: bool = False
    onboarding_completed_at: Optional[str] = None
    updated_at: str = Field(default_factory=utc_now)


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
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
    household_summary: Optional[str] = None
    reusable_planning_instructions: Optional[str] = None
    custom_store_options: Optional[List[str]] = None
    custom_meal_coverage_options: Optional[List[str]] = None
    custom_cooking_style_options: Optional[List[str]] = None
    custom_dietary_tags: Optional[List[str]] = None
    reusable_exclusions: Optional[List[str]] = None
    planner_prompt_override: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    onboarding_completed_at: Optional[str] = None


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
    prompt_override: Optional[str] = None
    custom_instructions: Optional[str] = None
    household_context_override: Optional[str] = None
    inventory_context_override: Optional[str] = None
    required_items_context_override: Optional[str] = None
    planning_notes: Optional[str] = None
    custom_store_options: Optional[List[str]] = None
    custom_meal_coverage_options: Optional[List[str]] = None
    custom_cooking_style_options: Optional[List[str]] = None
    custom_dietary_tags: Optional[List[str]] = None
    reusable_exclusions: Optional[List[str]] = None
    save_new_defaults: bool = False


class UpdatePlanBody(BaseModel):
    plan: dict


class RegenerateRecipeRequest(BaseModel):
    recipe_id: str
    preference: str = "similar"


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

ADVANCED CONTROL RULES
- Respect any promptOverride while still keeping JSON output only
- Treat customInstructions and planningNotes as high-priority user intent
- Use householdContextOverride, inventoryContextOverride, and requiredItemsContextOverride to fill gaps in structured data
- Consider customOptions as valid additions to the default choices rather than throwaway notes

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
  "selectedRecipes": [],
  "pantryMatches": [],
  "itemsToPurchase": [],
  "mergedGroceryListBySection": [],
  "householdItems": [],
  "estimatedTotal": null,
  "substitutions": [],
  "notes": []
}

QUALITY BAR
The plan must feel like something a real household would actually use this week."""


@api_router.post("/auth/signup")
async def signup(req: AuthRequest):
    email = req.email.strip().lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Account already exists")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": (req.name or "Household").strip() or "Household",
        "email": email,
        "password_hash": password_hash(req.password),
        "created_at": utc_now(),
    }
    await db.users.insert_one(user.copy())
    await ensure_profile(user_id, name=user["name"], email=email)
    token = secrets.token_urlsafe(32)
    session = {"id": str(uuid.uuid4()), "user_id": user_id, "token": token, "email": email, "name": user["name"], "created_at": utc_now()}
    await db.sessions.insert_one(session.copy())
    profile = await ensure_profile(user_id, name=user["name"], email=email)
    return {"token": token, "user": {"id": user_id, "name": user["name"], "email": email}, "profile": profile}


@api_router.post("/auth/login")
async def login(req: AuthRequest):
    email = req.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = secrets.token_urlsafe(32)
    session = {"id": str(uuid.uuid4()), "user_id": user["id"], "token": token, "email": email, "name": user["name"], "created_at": utc_now()}
    await db.sessions.insert_one(session.copy())
    profile = await ensure_profile(user["id"], name=user["name"], email=email)
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": email}, "profile": profile}


@api_router.get("/auth/me")
async def auth_me(authorization: Optional[str] = Header(default=None)):
    session = await require_session(authorization)
    profile = await ensure_profile(session["user_id"], name=session.get("name", "Household"), email=session.get("email"))
    return {
        "user": {"id": session["user_id"], "name": session.get("name", "Household"), "email": session.get("email")},
        "profile": profile,
    }


@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(default=None)):
    session = await require_session(authorization)
    await db.sessions.delete_many({"token": session["token"]})
    return {"success": True}


@api_router.get("/profile")
async def get_profile(authorization: Optional[str] = Header(default=None)):
    return await current_owner_profile(authorization)


@api_router.put("/profile")
async def update_profile(update: ProfileUpdate, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    owner_id = session["user_id"] if session else PUBLIC_OWNER_ID
    existing = await ensure_profile(owner_id, name=session.get("name", "Household") if session else "Household", email=session.get("email") if session else None)
    update_data = {k: v for k, v in update.dict().items() if v is not None}

    for key in (
        "preferred_stores",
        "meal_coverage",
        "cooking_style",
        "dietary_rules",
        "custom_store_options",
        "custom_meal_coverage_options",
        "custom_cooking_style_options",
        "custom_dietary_tags",
        "reusable_exclusions",
    ):
        if key in update_data:
            update_data[key] = normalize_list(update_data[key])

    if "name" in update_data and session:
        await db.users.update_one({"id": session["user_id"]}, {"$set": {"name": update_data["name"]}})
        await db.sessions.update_many({"user_id": session["user_id"]}, {"$set": {"name": update_data["name"]}})

    update_data["updated_at"] = utc_now()
    await db.household_profiles.update_one(owner_filter(owner_id), {"$set": update_data}, upsert=True)
    updated = await db.household_profiles.find_one(owner_filter(owner_id), {"_id": 0})
    return updated or existing


@api_router.post("/profile/reset")
async def reset_profile(authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    owner_id = session["user_id"] if session else PUBLIC_OWNER_ID
    await db.household_profiles.delete_many(owner_filter(owner_id))
    profile = await ensure_profile(owner_id, name=session.get("name", "Household") if session else "Household", email=session.get("email") if session else None)
    return profile


@api_router.get("/inventory")
async def get_inventory(location: Optional[str] = None, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    query = owner_filter(session["user_id"] if session else PUBLIC_OWNER_ID)
    if location:
        query["location"] = location
    return await db.inventory_items.find(query, {"_id": 0}).to_list(1000)


@api_router.post("/inventory")
async def add_inventory_item(item: InventoryItemCreate, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    doc = {
        "id": str(uuid.uuid4()),
        "owner_id": session["user_id"] if session else PUBLIC_OWNER_ID,
        "name": item.name,
        "quantity": item.quantity,
        "unit": item.unit,
        "location": item.location,
        "created_at": utc_now(),
    }
    await db.inventory_items.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc


@api_router.post("/inventory/batch")
async def add_inventory_batch(items: List[InventoryItemCreate], authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    owner_id = session["user_id"] if session else PUBLIC_OWNER_ID
    results = []
    for item in items:
        doc = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "name": item.name,
            "quantity": item.quantity,
            "unit": item.unit,
            "location": item.location,
            "created_at": utc_now(),
        }
        await db.inventory_items.insert_one(doc.copy())
        doc.pop("_id", None)
        results.append(doc)
    return results


@api_router.put("/inventory/{item_id}")
async def update_inventory_item(item_id: str, update: InventoryItemUpdate, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    query = {"id": item_id, "owner_id": session["user_id"] if session else PUBLIC_OWNER_ID}
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    result = await db.inventory_items.update_one(query, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return await db.inventory_items.find_one(query, {"_id": 0})


@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    query = {"id": item_id, "owner_id": session["user_id"] if session else PUBLIC_OWNER_ID}
    result = await db.inventory_items.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True}


@api_router.post("/inventory/extract-photo")
async def extract_photo(req: PhotoExtractRequest):
    try:
        from emergentintegrations.llm.chat import ImageContent, LlmChat, UserMessage

        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI key not configured")

        chat = LlmChat(
            api_key=api_key,
            session_id=f"photo-{uuid.uuid4()}",
            system_message=(
                "You are an inventory scanner. Given a photo of a pantry, fridge, or freezer, identify all visible food "
                "and household items. Return ONLY a valid JSON array of objects with keys: name (string), quantity "
                "(number estimate), unit (string like 'bottles', 'bags', 'boxes', 'lbs', 'items', 'cans'). No extra text."
            ),
        ).with_model("openai", "gpt-5.2")

        response = await chat.send_message(
            UserMessage(
                text=f"List every item visible in this {req.location} photo as a JSON array.",
                file_contents=[ImageContent(image_base64=req.image_base64)],
            )
        )

        text = response.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            end = -1 if lines[-1].strip().startswith("```") else len(lines)
            text = "\n".join(lines[1:end])

        items_raw = json.loads(text)
        extracted = []
        for item in items_raw:
            extracted.append(
                {
                    "id": str(uuid.uuid4()),
                    "name": item.get("name", "Unknown"),
                    "quantity": float(item.get("quantity", 1)),
                    "unit": item.get("unit", ""),
                    "location": req.location,
                }
            )
        return {"items": extracted}
    except json.JSONDecodeError:
        logger.error("Failed to parse AI photo response")
        raise HTTPException(status_code=500, detail="Failed to parse extracted items from photo")
    except Exception as exc:
        logger.error(f"Photo extraction error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@api_router.get("/required-items")
async def get_required_items(authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    return await db.required_items.find(owner_filter(session["user_id"] if session else PUBLIC_OWNER_ID), {"_id": 0}).to_list(1000)


@api_router.post("/required-items")
async def add_required_item(item: RequiredItemCreate, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    doc = {
        "id": str(uuid.uuid4()),
        "owner_id": session["user_id"] if session else PUBLIC_OWNER_ID,
        "name": item.name,
        "quantity": item.quantity,
        "unit": item.unit,
        "note": item.note,
        "category": item.category,
        "created_at": utc_now(),
    }
    await db.required_items.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc


@api_router.put("/required-items/{item_id}")
async def update_required_item(item_id: str, update: RequiredItemUpdate, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    query = {"id": item_id, "owner_id": session["user_id"] if session else PUBLIC_OWNER_ID}
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    result = await db.required_items.update_one(query, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return await db.required_items.find_one(query, {"_id": 0})


@api_router.delete("/required-items/{item_id}")
async def delete_required_item(item_id: str, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    query = {"id": item_id, "owner_id": session["user_id"] if session else PUBLIC_OWNER_ID}
    result = await db.required_items.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True}


@api_router.post("/generate-plan")
async def generate_plan(req: GeneratePlanRequest, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    owner_id = session["user_id"] if session else PUBLIC_OWNER_ID
    profile = await ensure_profile(owner_id, name=session.get("name", "Household") if session else "Household", email=session.get("email") if session else None)

    config = {**profile}
    for key, value in req.dict().items():
        if value is not None and key != "save_new_defaults":
            config[key] = value

    inventory = await db.inventory_items.find(owner_filter(owner_id), {"_id": 0}).to_list(1000)
    required = await db.required_items.find(owner_filter(owner_id), {"_id": 0}).to_list(1000)
    ai_input = build_planner_input(config, inventory, required, req.dict())

    if req.save_new_defaults:
        save_patch = {
            "custom_store_options": combine_options(profile.get("custom_store_options"), req.custom_store_options),
            "custom_meal_coverage_options": combine_options(profile.get("custom_meal_coverage_options"), req.custom_meal_coverage_options),
            "custom_cooking_style_options": combine_options(profile.get("custom_cooking_style_options"), req.custom_cooking_style_options),
            "custom_dietary_tags": combine_options(profile.get("custom_dietary_tags"), req.custom_dietary_tags),
            "reusable_exclusions": combine_options(profile.get("reusable_exclusions"), req.reusable_exclusions),
            "reusable_planning_instructions": req.custom_instructions or profile.get("reusable_planning_instructions", ""),
            "planner_prompt_override": req.prompt_override or profile.get("planner_prompt_override", ""),
            "updated_at": utc_now(),
        }
        await db.household_profiles.update_one(owner_filter(owner_id), {"$set": save_patch}, upsert=True)

    try:
        plan_data = await generate_plan_with_provider(PLANNER_SYSTEM_PROMPT, ai_input)
        plan_record = {
            "id": str(uuid.uuid4()),
            "owner_id": owner_id,
            "plan": plan_data,
            "config": {k: v for k, v in config.items() if k != "_id"},
            "ai_input": ai_input,
            "created_at": utc_now(),
        }
        await db.current_plan.delete_many(owner_filter(owner_id))
        await db.current_plan.insert_one(plan_record.copy())
        plan_record.pop("_id", None)
        return plan_record
    except json.JSONDecodeError:
        logger.error("Failed to parse AI plan response")
        raise HTTPException(status_code=500, detail="AI returned invalid format. Please try again.")
    except Exception as exc:
        logger.error(f"Plan generation error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@api_router.get("/current-plan")
async def get_current_plan(authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    plan = await db.current_plan.find_one(owner_filter(session["user_id"] if session else PUBLIC_OWNER_ID), {"_id": 0})
    return plan or {"plan": None}


@api_router.put("/current-plan")
async def update_current_plan(body: UpdatePlanBody, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    owner_id = session["user_id"] if session else PUBLIC_OWNER_ID
    existing = await db.current_plan.find_one(owner_filter(owner_id))
    if not existing:
        raise HTTPException(status_code=404, detail="No current plan")
    await db.current_plan.update_one({"_id": existing["_id"]}, {"$set": {"plan": body.plan}})
    return await db.current_plan.find_one(owner_filter(owner_id), {"_id": 0})


@api_router.delete("/current-plan/recipe/{recipe_id}")
async def remove_recipe(recipe_id: str, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    owner_id = session["user_id"] if session else PUBLIC_OWNER_ID
    plan_doc = await db.current_plan.find_one(owner_filter(owner_id))
    if not plan_doc:
        raise HTTPException(status_code=404, detail="No current plan")
    plan = plan_doc.get("plan", {})
    plan["selectedRecipes"] = [recipe for recipe in plan.get("selectedRecipes", []) if recipe.get("id") != recipe_id]
    await db.current_plan.update_one({"_id": plan_doc["_id"]}, {"$set": {"plan": plan}})
    return await db.current_plan.find_one(owner_filter(owner_id), {"_id": 0})


@api_router.post("/regenerate-recipe")
async def regenerate_recipe(req: RegenerateRecipeRequest, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    owner_id = session["user_id"] if session else PUBLIC_OWNER_ID
    plan_doc = await db.current_plan.find_one(owner_filter(owner_id), {"_id": 0})
    if not plan_doc or not plan_doc.get("plan"):
        raise HTTPException(status_code=404, detail="No current plan")

    old_recipe = None
    for recipe in plan_doc["plan"].get("selectedRecipes", []):
        if recipe.get("id") == req.recipe_id:
            old_recipe = recipe
            break
    if not old_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    inventory = await db.inventory_items.find(owner_filter(owner_id), {"_id": 0}).to_list(1000)
    try:
        new_recipe = await generate_recipe_replacement(old_recipe, plan_doc.get("config", {}), inventory, req.preference)
        plan = plan_doc["plan"]
        plan["selectedRecipes"] = [new_recipe if recipe.get("id") == req.recipe_id else recipe for recipe in plan.get("selectedRecipes", [])]
        raw_doc = await db.current_plan.find_one(owner_filter(owner_id))
        await db.current_plan.update_one({"_id": raw_doc["_id"]}, {"$set": {"plan": plan}})
        return await db.current_plan.find_one(owner_filter(owner_id), {"_id": 0})
    except Exception as exc:
        logger.error(f"Recipe regeneration error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@api_router.get("/history")
async def get_history(authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    return await db.weekly_history.find(owner_filter(session["user_id"] if session else PUBLIC_OWNER_ID), {"_id": 0}).sort("created_at", -1).to_list(50)


@api_router.post("/history/save")
async def save_to_history(authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    owner_id = session["user_id"] if session else PUBLIC_OWNER_ID
    plan = await db.current_plan.find_one(owner_filter(owner_id), {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="No current plan to save")
    history_entry = {
        "id": str(uuid.uuid4()),
        "owner_id": owner_id,
        "plan": plan.get("plan"),
        "config": plan.get("config"),
        "saved_at": utc_now(),
        "created_at": plan.get("created_at"),
    }
    await db.weekly_history.insert_one(history_entry.copy())
    history_entry.pop("_id", None)
    return history_entry


@api_router.post("/history/{history_id}/duplicate")
async def duplicate_from_history(history_id: str, authorization: Optional[str] = Header(default=None)):
    session = await get_session(authorization)
    owner_id = session["user_id"] if session else PUBLIC_OWNER_ID
    entry = await db.weekly_history.find_one({"id": history_id, "owner_id": owner_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    plan_record = {
        "id": str(uuid.uuid4()),
        "owner_id": owner_id,
        "plan": entry.get("plan"),
        "config": entry.get("config"),
        "created_at": utc_now(),
    }
    await db.current_plan.delete_many(owner_filter(owner_id))
    await db.current_plan.insert_one(plan_record.copy())
    plan_record.pop("_id", None)
    return plan_record


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
