#!/usr/bin/env python3
"""
Integration tests for Suspect Vehicle endpoints.

These tests expect the backend server to be running at http://localhost:8000
They create a temporary suspect, add/update/delete vehicles and then clean up.
"""

import requests
import time

API_BASE = 'http://localhost:8000'


def test_vehicle_crud_flow():
    # 1) create a suspect
    suspect_payload = {
        "full_name": "Test Suspect for Vehicles",
        "created_by": 1
    }
    r = requests.post(f"{API_BASE}/api/suspects/", json=suspect_payload)
    assert r.status_code in (200, 201), f"Failed to create suspect: {r.status_code} {r.text}"
    suspect = r.json()
    suspect_id = suspect.get('id')
    assert suspect_id, "No suspect id returned"

    try:
        # 2) initially, vehicles list should be empty
        r = requests.get(f"{API_BASE}/api/suspects/{suspect_id}/vehicles")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

        # 3) create a vehicle
        vehicle_payload = {"make": "Lada", "color": "черный", "owner": "Иванов", "plate": "А123ВС"}
        r = requests.post(f"{API_BASE}/api/suspects/{suspect_id}/vehicles", json=vehicle_payload)
        assert r.status_code in (200, 201), f"Create vehicle failed: {r.status_code} {r.text}"
        vehicle = r.json()
        vehicle_id = vehicle.get('id')
        assert vehicle_id, "No vehicle id returned"
        assert vehicle.get('suspect_id') == suspect_id

        # 4) list should contain the vehicle
        r = requests.get(f"{API_BASE}/api/suspects/{suspect_id}/vehicles")
        assert r.status_code == 200
        vehicles = r.json()
        assert any(v.get('id') == vehicle_id for v in vehicles), "Created vehicle not found in list"

        # 5) update the vehicle
        r = requests.put(f"{API_BASE}/api/suspects/{suspect_id}/vehicles/{vehicle_id}", json={"color": "белый"})
        assert r.status_code == 200
        updated = r.json()
        assert updated.get('color') == 'белый'

        # 6) delete the vehicle
        r = requests.delete(f"{API_BASE}/api/suspects/{suspect_id}/vehicles/{vehicle_id}")
        assert r.status_code == 200
        resp = r.json()
        assert resp.get('vehicle_id') == vehicle_id

        # 7) confirm deletion
        r = requests.get(f"{API_BASE}/api/suspects/{suspect_id}/vehicles")
        assert r.status_code == 200
        vehicles = r.json()
        assert not any(v.get('id') == vehicle_id for v in vehicles)

    finally:
        # cleanup: delete suspect
        try:
            requests.delete(f"{API_BASE}/api/suspects/{suspect_id}")
        except Exception:
            pass


if __name__ == '__main__':
    # simple runner when invoked directly
    # wait a bit for server to come up if needed
    print('Running vehicle API tests...')
    time.sleep(0.5)
    test_vehicle_crud_flow()
    print('Done')
