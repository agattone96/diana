import re
import os
from pathlib import Path

import pytest
from fastapi import HTTPException

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/testdb")

from backend import server


PROTECTED_ENDPOINTS = [
    "get_profile",
    "update_profile",
    "reset_profile",
    "get_inventory",
    "add_inventory_item",
    "add_inventory_batch",
    "update_inventory_item",
    "delete_inventory_item",
    "get_required_items",
    "add_required_item",
    "update_required_item",
    "delete_required_item",
    "generate_plan",
    "get_current_plan",
    "update_current_plan",
    "remove_recipe",
    "regenerate_recipe",
    "get_history",
    "save_to_history",
    "duplicate_from_history",
]


@pytest.mark.asyncio
async def test_require_session_rejects_missing_bearer_token():
    with pytest.raises(HTTPException) as exc:
        await server.require_session(None)
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_require_session_rejects_invalid_bearer_token(monkeypatch):
    async def fake_get_session(_authorization):
        return None

    monkeypatch.setattr(server, "get_session", fake_get_session)

    with pytest.raises(HTTPException) as exc:
        await server.require_session("Bearer invalid")
    assert exc.value.status_code == 401


def test_public_owner_fallback_removed_from_server_source():
    source = Path(server.__file__).read_text()
    assert "PUBLIC_OWNER_ID" not in source
    assert "if session else" not in source


@pytest.mark.parametrize("endpoint_name", PROTECTED_ENDPOINTS)
def test_protected_endpoints_enforce_session(endpoint_name):
    source = Path(server.__file__).read_text()
    pattern = rf"async def {endpoint_name}\([^)]*\):[\s\S]*?await require_session\(authorization\)"
    assert re.search(pattern, source), f"{endpoint_name} must call require_session(authorization)"
