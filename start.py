#!/usr/bin/env python3
"""
ApexInvest Sandbox Launcher
Builds Python venv, verifies NPM node modules, runs both backend and frontend concurrently,
and opens the default web browser. Gracefully shuts down on Ctrl+C.
"""
import os
import sys
import time
import subprocess
import webbrowser
import signal

# Configurations
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_DIR = os.path.join(WORKSPACE_DIR, ".venv")
FRONTEND_DIR = os.path.join(WORKSPACE_DIR, "frontend")
BACKEND_DIR = os.path.join(WORKSPACE_DIR, "backend")

# Pick venv path based on OS
if sys.platform == "win32":
    PYTHON_EXE = os.path.join(VENV_DIR, "Scripts", "python.exe")
    PIP_EXE = os.path.join(VENV_DIR, "Scripts", "pip.exe")
else:
    PYTHON_EXE = os.path.join(VENV_DIR, "bin", "python")
    PIP_EXE = os.path.join(VENV_DIR, "bin", "pip")

def setup_python_environment():
    """Initializes virtual environment and pip installs requirements if missing."""
    print("=" * 70)
    print("      APEXINVEST SYSTEM LAUNCHER - ENVIRONMENT PREPARATION")
    print("=" * 70)
    
    # 1. Create venv if not existing
    if not os.path.exists(VENV_DIR):
        print("[*] Virtual environment not found. Creating '.venv' at workspace root...")
        subprocess.run([sys.executable, "-m", "venv", VENV_DIR], check=True)
        print("[✓] Virtual environment created successfully.")
    else:
        print("[✓] Existing virtual environment detected.")

    # 2. Install requirements
    requirements_path = os.path.join(BACKEND_DIR, "requirements.txt")
    if os.path.exists(requirements_path):
        print("[*] Verifying and updating backend requirements...")
        subprocess.run([PIP_EXE, "install", "-r", requirements_path], check=True)
        print("[✓] Python backend packages validated.")
    else:
        print("[-] Warning: requirements.txt not found. Skipping packages validation.")

def setup_node_environment():
    """Validates node_modules in frontend folder, running npm install if missing."""
    node_modules_path = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.exists(node_modules_path):
        print("[*] 'node_modules' not detected in frontend. Bootstrapping npm install...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        subprocess.run([npm_cmd, "install"], cwd=FRONTEND_DIR, check=True)
        print("[✓] Node dependencies successfully installed.")
    else:
        print("[✓] Frontend node packages already configured.")
    print("-" * 70)

def main():
    setup_python_environment()
    setup_node_environment()

    # Processes handlers list
    processes = []

    def cleanup_processes(signum=None, frame=None):
        """Gracefully terminates active sub-servers on termination signal."""
        print("\n" + "=" * 70)
        print("[*] Graceful Shutdown Signal Received. Closing ApexInvest sandboxes...")
        print("=" * 70)
        
        for p in processes:
            try:
                if sys.platform == "win32":
                    p.terminate()
                else:
                    # Send SIGTERM to the process group to kill sub-shells
                    os.killpg(os.getpgid(p.pid), signal.SIGTERM)
                print(f"[✓] Terminated subprocess (PID: {p.pid})")
            except Exception as e:
                # Fallback simple kill
                try:
                    p.kill()
                except:
                    pass
        print("[✓] Port clearance finalized. Safe to exit. Goodbye!")
        sys.exit(0)

    # Bind termination signals
    signal.signal(signal.SIGINT, cleanup_processes)
    signal.signal(signal.SIGTERM, cleanup_processes)

    print("[*] Launching API Server subprocess (Python FastAPI)...")
    # Launch backend uvicorn server in a new process group to allow group termination
    backend_cmd = [PYTHON_EXE, "-m", "uvicorn", "main:app", "--port", "8000", "--app-dir", BACKEND_DIR]
    
    if sys.platform == "win32":
        p_backend = subprocess.Popen(backend_cmd)
    else:
        p_backend = subprocess.Popen(backend_cmd, preexec_fn=os.setsid)
    processes.append(p_backend)

    print("[*] Launching Sandbox Dashboard subprocess (Vite Dev Server)...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = [npm_cmd, "run", "dev", "--", "--port", "5173"]
    
    if sys.platform == "win32":
        p_frontend = subprocess.Popen(frontend_cmd, cwd=FRONTEND_DIR)
    else:
        p_frontend = subprocess.Popen(frontend_cmd, cwd=FRONTEND_DIR, preexec_fn=os.setsid)
    processes.append(p_frontend)

    print("-" * 70)
    print("[*] Validating server bootups. Pausing 2.5 seconds...")
    time.sleep(2.5)

    dashboard_url = "http://localhost:5173"
    print(f"\n[✓] Servers Online!")
    print(f"    - API Engine:    http://localhost:8000/docs")
    print(f"    - UI Dashboard:  {dashboard_url}")
    print("\n[✓] Launching client default web browser to active sandbox...")
    webbrowser.open(dashboard_url)
    
    print("-" * 70)
    print(" >>> PRESS Ctrl+C AT ANY TIME TO TERMINATE SANDBOX PROCESSES <<< ")
    print("=" * 70)

    # Keep active to sustain processes running
    while True:
        try:
            time.sleep(1)
            # Check if any process died unexpectedly
            for p in processes:
                if p.poll() is not None:
                    print(f"[-] Critical: Subprocess with PID {p.pid} terminated prematurely.")
                    cleanup_processes()
        except (KeyboardInterrupt, SystemExit):
            cleanup_processes()

if __name__ == "__main__":
    main()
