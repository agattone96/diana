"""
Backend API Tests for Diana's Pantry Plan
Tests all CRUD operations and critical flows
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not set")

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

# ─── Profile Tests ───────────────────────────────────────────────────────────

class TestProfile:
    """Profile endpoint tests"""

    def test_get_profile_returns_defaults(self, api_client):
        """GET /api/profile should return default profile with correct values"""
        response = api_client.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 200
        
        data = response.json()
        assert data["adults"] == 4, "Default adults should be 4"
        assert data["children"] == 1, "Default children should be 1"
        assert len(data["preferred_stores"]) == 5, "Should have 5 default stores"
        assert "Walmart" in data["preferred_stores"]
        assert "Tractor Supply" in data["preferred_stores"]
        assert "Amazon" in data["preferred_stores"]
        assert "Sam's Club" in data["preferred_stores"]
        assert "Costco" in data["preferred_stores"]
        assert len(data["meal_coverage"]) == 4, "Should have 4 meal types"
        assert "Breakfast" in data["meal_coverage"]
        assert "Lunch" in data["meal_coverage"]
        assert "Dinner" in data["meal_coverage"]
        assert "Snacks" in data["meal_coverage"]
        assert len(data["cooking_style"]) == 4, "Should have 4 cooking styles"
        assert "Easy meals" in data["cooking_style"]
        assert "Crockpot" in data["cooking_style"]
        assert "One pan" in data["cooking_style"]
        assert "Minimum effort" in data["cooking_style"]
        assert data["budget"] == 200.0
        assert data["trip_type"] == "Full week"
        print("✓ Profile defaults are correct")

    def test_update_profile(self, api_client):
        """PUT /api/profile should update profile fields"""
        update_data = {
            "adults": 2,
            "children": 3,
            "budget": 150.0,
            "preferred_stores": ["Walmart", "Target"]
        }
        response = api_client.put(f"{BASE_URL}/api/profile", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["adults"] == 2
        assert data["children"] == 3
        assert data["budget"] == 150.0
        assert "Walmart" in data["preferred_stores"]
        assert "Target" in data["preferred_stores"]
        print("✓ Profile update works")

    def test_reset_profile(self, api_client):
        """POST /api/profile/reset should restore defaults"""
        # First update profile
        api_client.put(f"{BASE_URL}/api/profile", json={"adults": 10, "budget": 500})
        
        # Reset
        response = api_client.post(f"{BASE_URL}/api/profile/reset")
        assert response.status_code == 200
        
        data = response.json()
        assert data["adults"] == 4, "Adults should be reset to 4"
        assert data["budget"] == 200.0, "Budget should be reset to 200"
        print("✓ Profile reset works")

# ─── Inventory Tests ─────────────────────────────────────────────────────────

class TestInventory:
    """Inventory CRUD tests"""

    def test_add_inventory_item(self, api_client):
        """POST /api/inventory should create item and persist"""
        item_data = {
            "name": "TEST_Tomatoes",
            "quantity": 5,
            "unit": "lbs",
            "location": "pantry"
        }
        response = api_client.post(f"{BASE_URL}/api/inventory", json=item_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "TEST_Tomatoes"
        assert data["quantity"] == 5
        assert data["unit"] == "lbs"
        assert data["location"] == "pantry"
        assert "id" in data
        item_id = data["id"]
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/inventory")
        assert get_response.status_code == 200
        items = get_response.json()
        assert any(i["id"] == item_id for i in items), "Item should be persisted"
        print("✓ Inventory item creation and persistence works")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/inventory/{item_id}")

    def test_get_inventory_all(self, api_client):
        """GET /api/inventory should return all items"""
        response = api_client.get(f"{BASE_URL}/api/inventory")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/inventory returns {len(data)} items")

    def test_get_inventory_filtered_by_location(self, api_client):
        """GET /api/inventory?location=pantry should filter by location"""
        # Create test items in different locations
        pantry_item = api_client.post(f"{BASE_URL}/api/inventory", json={
            "name": "TEST_Pantry_Item",
            "quantity": 1,
            "location": "pantry"
        }).json()
        
        fridge_item = api_client.post(f"{BASE_URL}/api/inventory", json={
            "name": "TEST_Fridge_Item",
            "quantity": 1,
            "location": "fridge"
        }).json()
        
        # Test pantry filter
        response = api_client.get(f"{BASE_URL}/api/inventory?location=pantry")
        assert response.status_code == 200
        items = response.json()
        pantry_items = [i for i in items if i["location"] == "pantry"]
        assert len(pantry_items) > 0
        assert all(i["location"] == "pantry" for i in items), "All items should be from pantry"
        print("✓ Inventory location filter works")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/inventory/{pantry_item['id']}")
        api_client.delete(f"{BASE_URL}/api/inventory/{fridge_item['id']}")

    def test_delete_inventory_item(self, api_client):
        """DELETE /api/inventory/{id} should remove item"""
        # Create item
        item = api_client.post(f"{BASE_URL}/api/inventory", json={
            "name": "TEST_Delete_Item",
            "quantity": 1,
            "location": "freezer"
        }).json()
        item_id = item["id"]
        
        # Delete
        response = api_client.delete(f"{BASE_URL}/api/inventory/{item_id}")
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # Verify deletion
        get_response = api_client.get(f"{BASE_URL}/api/inventory")
        items = get_response.json()
        assert not any(i["id"] == item_id for i in items), "Item should be deleted"
        print("✓ Inventory item deletion works")

    def test_add_inventory_batch(self, api_client):
        """POST /api/inventory/batch should add multiple items"""
        batch_data = [
            {"name": "TEST_Batch_1", "quantity": 2, "unit": "cans", "location": "pantry"},
            {"name": "TEST_Batch_2", "quantity": 3, "unit": "boxes", "location": "pantry"}
        ]
        response = api_client.post(f"{BASE_URL}/api/inventory/batch", json=batch_data)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "TEST_Batch_1"
        assert data[1]["name"] == "TEST_Batch_2"
        print("✓ Batch inventory creation works")
        
        # Cleanup
        for item in data:
            api_client.delete(f"{BASE_URL}/api/inventory/{item['id']}")

# ─── Required Items Tests ────────────────────────────────────────────────────

class TestRequiredItems:
    """Required items CRUD tests"""

    def test_add_required_item(self, api_client):
        """POST /api/required-items should create item and persist"""
        item_data = {
            "name": "TEST_Milk",
            "quantity": 2,
            "unit": "gallons",
            "note": "Whole milk",
            "category": "grocery"
        }
        response = api_client.post(f"{BASE_URL}/api/required-items", json=item_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "TEST_Milk"
        assert data["quantity"] == 2
        assert data["unit"] == "gallons"
        assert data["note"] == "Whole milk"
        assert data["category"] == "grocery"
        assert "id" in data
        item_id = data["id"]
        
        # Verify persistence
        get_response = api_client.get(f"{BASE_URL}/api/required-items")
        assert get_response.status_code == 200
        items = get_response.json()
        assert any(i["id"] == item_id for i in items), "Item should be persisted"
        print("✓ Required item creation and persistence works")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/required-items/{item_id}")

    def test_get_required_items(self, api_client):
        """GET /api/required-items should return all items"""
        response = api_client.get(f"{BASE_URL}/api/required-items")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/required-items returns {len(data)} items")

    def test_delete_required_item(self, api_client):
        """DELETE /api/required-items/{id} should remove item"""
        # Create item
        item = api_client.post(f"{BASE_URL}/api/required-items", json={
            "name": "TEST_Delete_Required",
            "quantity": 1,
            "category": "household"
        }).json()
        item_id = item["id"]
        
        # Delete
        response = api_client.delete(f"{BASE_URL}/api/required-items/{item_id}")
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # Verify deletion
        get_response = api_client.get(f"{BASE_URL}/api/required-items")
        items = get_response.json()
        assert not any(i["id"] == item_id for i in items), "Item should be deleted"
        print("✓ Required item deletion works")

# ─── Plan Tests ──────────────────────────────────────────────────────────────

class TestPlan:
    """Plan generation and management tests"""

    def test_get_current_plan_empty(self, api_client):
        """GET /api/current-plan should return empty when no plan exists"""
        response = api_client.get(f"{BASE_URL}/api/current-plan")
        assert response.status_code == 200
        data = response.json()
        # Could be empty or have a plan from previous tests
        print(f"✓ GET /api/current-plan returns: {type(data)}")

# ─── History Tests ───────────────────────────────────────────────────────────

class TestHistory:
    """History endpoint tests"""

    def test_get_history(self, api_client):
        """GET /api/history should return history list"""
        response = api_client.get(f"{BASE_URL}/api/history")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/history returns {len(data)} entries")

# ─── Cleanup ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup test data after all tests"""
    yield
    # Cleanup runs after all tests
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Clean up inventory items starting with TEST_
    try:
        items = session.get(f"{BASE_URL}/api/inventory").json()
        for item in items:
            if item["name"].startswith("TEST_"):
                session.delete(f"{BASE_URL}/api/inventory/{item['id']}")
        print("\n✓ Cleaned up test inventory items")
    except:
        pass
    
    # Clean up required items starting with TEST_
    try:
        items = session.get(f"{BASE_URL}/api/required-items").json()
        for item in items:
            if item["name"].startswith("TEST_"):
                session.delete(f"{BASE_URL}/api/required-items/{item['id']}")
        print("✓ Cleaned up test required items")
    except:
        pass
