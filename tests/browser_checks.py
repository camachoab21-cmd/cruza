"""Shared checks for Chromium against the real CRUZA server."""
import os
import subprocess
import time


def wait_for_state(page, expression, arg=None, timeout=10):
    # Poll via the debugging protocol so the app keeps its real CSP.
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        result = page.evaluate(expression) if arg is None else page.evaluate(expression, arg)
        if result:
            return
        time.sleep(0.05)
    raise AssertionError(f"Timed out waiting for browser state: {expression}")


def stop_server(process):
    if os.name == 'nt' and process.poll() is None:
        # The venv launcher starts a child Python process on Windows.
        subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    if process.poll() is None:
        process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)
