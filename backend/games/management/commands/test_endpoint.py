from django.core.management.base import BaseCommand
import requests
import json


class Command(BaseCommand):
    help = 'Test the number-recall endpoint'

    def handle(self, *args, **options):
        # Test data similar to what frontend sends
        test_data = {
            "sequence": "1234",
            "user_response": "",
            "score": 100,
            "level_reached": 1,
            "xp": 10,
            "streaks": 0,
            "mistakes": 0,
            "correct_answers": 1,
            "message": "Game over!"
        }
        
        # Test GET first
        try:
            response = requests.get("http://127.0.0.1:8000/api/games/number-recall/")
            self.stdout.write(f"GET Response: {response.status_code}")
            if response.status_code == 200:
                self.stdout.write(f"GET Content: {response.json()}")
            else:
                self.stdout.write(f"GET Error: {response.text}")
        except Exception as e:
            self.stdout.write(f"GET Exception: {e}")
        
        # Test POST without auth
        try:
            response = requests.post(
                "http://127.0.0.1:8000/api/games/number-recall/",
                headers={"Content-Type": "application/json"},
                data=json.dumps(test_data)
            )
            self.stdout.write(f"POST Response (no auth): {response.status_code}")
            self.stdout.write(f"POST Content: {response.text}")
        except Exception as e:
            self.stdout.write(f"POST Exception: {e}")
