#!/usr/bin/env python3
"""
Test script for user update functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_user_update():
    """Test updating user profile"""
    
    # Create a temporary test user to exercise update logic so we don't touch production accounts
    print("Creating temporary test user...")
    temp_user_data = {
        "discord_id": "test_update_" + str(int(__import__('time').time())),
        "username": "test_update_user",
        "full_name": "Temp Update User",
        "badge_number": "BADGE-TMP"
    }
    resp = requests.post(f"{BASE_URL}/api/users/", json=temp_user_data)
    if resp.status_code != 200:
        print(f"❌ Failed to create temp user: {resp.status_code} {resp.text}")
        return

    temp_user = resp.json()
    temp_id = temp_user.get('id')
    print(f"Created temp user id={temp_id}")

    try:
        # Update user data for the temporary user
        update_data = {
            "full_name": "Updated Test User",
            "rank": "senior_detective",
            "department": "Testing Unit",
            "badge_number": "BADGE-TMP-UPDATED"
        }

        print(f"\nUpdating temp user id={temp_id} with data: {json.dumps(update_data, indent=2)}")
        update_response = requests.put(
            f"{BASE_URL}/api/users/{temp_id}",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )

        if update_response.status_code == 200:
            updated_user = update_response.json()
            print(f"✅ Temp user updated successfully!")
            print(f"Updated user: {json.dumps(updated_user, indent=2)}")
        else:
            print(f"❌ Failed to update temp user: {update_response.status_code}")
            print(f"Error: {update_response.text}")
    finally:
        # Clean up: delete the temporary user
        try:
            del_resp = requests.delete(f"{BASE_URL}/api/users/{temp_id}")
            if del_resp.status_code == 200:
                print(f"Deleted temp user id={temp_id}")
            else:
                print(f"Warning: failed to delete temp user id={temp_id}: {del_resp.status_code}")
        except Exception as ex:
            print(f"Warning: exception while deleting temp user: {ex}")

if __name__ == "__main__":
    test_user_update()