import csv
import time
import requests

CSV_FILE = 'ip_addresses.csv'
SERVER_URL = 'http://backend:5000/receive'


def read_and_send():
    with open(CSV_FILE, 'r') as f:
        reader = csv.DictReader(f)
        data = list(reader)

    # Сортируем по Timestamp
    data.sort(key=lambda x: x['Timestamp'])

    prev_time = None
    for row in data:
        current_time = int(row['Timestamp'])

        if prev_time:
            diff = current_time - prev_time
            if diff > 0:
                time.sleep(diff)

        prev_time = current_time

        payload = {
            'ip': row['ip address'],
            'lat': float(row['Latitude']),
            'lon': float(row['Longitude']),
            'timestamp': row['Timestamp'],
            'suspicious': int(float(row['suspicious']))
        }

        try:
            requests.post(SERVER_URL, json=payload)
            print(f"Sent: {payload}")
        except Exception as e:
            print(f"Failed to send: {e}")


if __name__ == '__main__':
    read_and_send()
