#!/usr/bin/env python3
"""
Unit/integration tests for Vehicle endpoints using FastAPI TestClient.

These tests import the application and run it in-process so no external
server is required.
"""

from init_db import init_database

# Ensure database tables are created before importing the app
init_database()

from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_vehicle_crud_with_testclient():
    # create suspect
    r = client.post('/api/suspects/', json={"full_name": "TC Suspect", "created_by": 1})
    assert r.status_code in (200, 201)
    suspect = r.json()
    suspect_id = suspect.get('id')
    assert suspect_id

    try:
        # list vehicles initially
        r = client.get(f'/api/suspects/{suspect_id}/vehicles')
        assert r.status_code == 200
        assert isinstance(r.json(), list)

        # create vehicle
        payload = {"make": "Toyota", "color": "red", "owner": "Test Owner", "plate": "T123XX"}
        r = client.post(f'/api/suspects/{suspect_id}/vehicles', json=payload)
        assert r.status_code in (200, 201)
        vehicle = r.json()
        vid = vehicle.get('id')
        assert vid

        # get list
        r = client.get(f'/api/suspects/{suspect_id}/vehicles')
        assert r.status_code == 200
        assert any(v.get('id') == vid for v in r.json())

        # update
        r = client.put(f'/api/suspects/{suspect_id}/vehicles/{vid}', json={"color": "black"})
        assert r.status_code == 200
        assert r.json().get('color') == 'black'

        # delete
        r = client.delete(f'/api/suspects/{suspect_id}/vehicles/{vid}')
        assert r.status_code == 200

        # ensure deleted
        r = client.get(f'/api/suspects/{suspect_id}/vehicles')
        assert r.status_code == 200
        assert not any(v.get('id') == vid for v in r.json())

    finally:
        client.delete(f'/api/suspects/{suspect_id}')
