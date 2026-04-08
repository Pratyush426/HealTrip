"""
HealTrip ML Services Startup Script
Starts all 3 Python ML microservices on their respective ports:
  - Hotels:    port 8000  (ml/hotels/main.py)
  - Hospitals: port 8001  (ml/hospitals/main.py)
  - Flights:   port 8002  (ml/flights/main.py)

Usage:
  python start_ml_services.py

Stop: Press Ctrl+C to stop all services.
"""

import subprocess
import sys
import os
import time
import signal
import platform

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SERVICES = [
    {
        "name": "Hotels ML",
        "port": 8000,
        "dir": os.path.join(BASE_DIR, "backend", "ml", "hotels"),
        "script": "main.py",
        "color": "\033[94m",  # Blue
    },
    {
        "name": "Hospitals ML",
        "port": 8001,
        "dir": os.path.join(BASE_DIR, "backend", "ml", "hospitals"),
        "script": "main.py",
        "color": "\033[92m",  # Green
    },
    {
        "name": "Flights ML",
        "port": 8002,
        "dir": os.path.join(BASE_DIR, "backend", "ml", "flights"),
        "script": "main.py",
        "color": "\033[95m",  # Purple
    },
]

RESET = "\033[0m"
BOLD = "\033[1m"
YELLOW = "\033[93m"
RED = "\033[91m"

processes = []


def log(service_name, port, color, msg):
    print(f"{color}{BOLD}[{service_name}:{port}]{RESET} {msg}")


def start_services():
    print(f"\n{BOLD}{'='*55}{RESET}")
    print(f"{BOLD}  🚀 HealTrip ML Services Launcher{RESET}")
    print(f"{BOLD}{'='*55}{RESET}\n")

    for svc in SERVICES:
        script_path = os.path.join(svc["dir"], svc["script"])

        if not os.path.exists(script_path):
            print(f"{RED}[ERROR] {svc['name']}: Script not found at {script_path}{RESET}")
            continue

        log(svc["name"], svc["port"], svc["color"], f"Starting on port {svc['port']}...")

        try:
            proc = subprocess.Popen(
                [sys.executable, svc["script"]],
                cwd=svc["dir"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )
            processes.append({"proc": proc, **svc})
            log(svc["name"], svc["port"], svc["color"], f"✅ PID {proc.pid} started")
        except Exception as e:
            print(f"{RED}[ERROR] {svc['name']}: Failed to start — {e}{RESET}")

    print(f"\n{YELLOW}{'='*55}{RESET}")
    print(f"{YELLOW}All services launching. URLs:{RESET}")
    for svc in SERVICES:
        print(f"  {svc['color']}• {svc['name']}: http://localhost:{svc['port']}{RESET}")
    print(f"{YELLOW}{'='*55}{RESET}")
    print(f"\nPress {BOLD}Ctrl+C{RESET} to stop all services.\n")

    # Stream logs
    try:
        while True:
            for item in processes:
                proc = item["proc"]
                if proc.stdout:
                    line = proc.stdout.readline()
                    if line:
                        print(f"{item['color']}[{item['name']}]{RESET} {line.rstrip()}")
            time.sleep(0.1)
    except KeyboardInterrupt:
        stop_services()


def stop_services():
    print(f"\n\n{YELLOW}Stopping all ML services...{RESET}")
    for item in processes:
        try:
            item["proc"].terminate()
            item["proc"].wait(timeout=5)
            log(item["name"], item["port"], item["color"], "Stopped.")
        except Exception as e:
            print(f"{RED}Could not stop {item['name']}: {e}{RESET}")
    print(f"\n{BOLD}All services stopped. Goodbye!{RESET}\n")
    sys.exit(0)


if __name__ == "__main__":
    start_services()
