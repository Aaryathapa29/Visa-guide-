"""
Socket.IO client utility for Django to emit notifications to connected clients.
Optimized for decoupled microservice architectures.
"""

import os
import socketio
from dotenv import load_dotenv

load_dotenv()

# Create Socket.IO client
sio_client = socketio.Client()
SOCKETIO_SERVER_URL = os.getenv('SOCKETIO_SERVER_URL', 'http://localhost:5000')


def ensure_connected():
    """
    Checks connection state. If disconnected, safely attempts a connection 
    with a short timeout so it doesn't hang Django during management tasks.
    """
    if sio_client.connected:
        return True
        
    try:
        # Removed hardcoded 'websocket' transport constraint to allow polling fallback 
        # Added wait_timeout=1 so it instantly fails if the server is offline
        sio_client.connect(SOCKETIO_SERVER_URL, wait_timeout=1)
        print(f'[Socket.IO] Connected to server at {SOCKETIO_SERVER_URL}')
        return True
    except Exception as e:
        print(f'[Socket.IO Warning] Server offline or unreachable at {SOCKETIO_SERVER_URL}: {e}')
        return False


def disconnect_from_socketio():
    """Disconnect from Socket.IO server"""
    try:
        if sio_client.connected:
            sio_client.disconnect()
            print('[Socket.IO] Successfully disconnected.')
    except Exception as e:
        print(f'[Socket.IO] Error disconnecting: {e}')


def emit_notification_to_consultancy(consultancy_id, notification_data):
    """
    Emit notification to a specific consultancy.
    Safe to call anywhere; won't crash your server if the socket app is offline.
    """
    # 1. Safely evaluate connection status at execution time
    if not ensure_connected():
        print(f'[Socket.IO Fallback] Notification dropped for consultancy {consultancy_id} (Server down).')
        return

    # 2. Emit the event payload
    try:
        sio_client.emit('send_notification', {
            'consultancy_id': consultancy_id,
            'notification': notification_data
        })
        print(f'[Socket.IO] Notification emitted for consultancy {consultancy_id}')
    except Exception as e:
        print(f'[Socket.IO Error] Failed to emit event: {e}')

# --- REMOVED THE AUTO-CONNECT ON MODULE IMPORT ---
# Connection is now entirely driven lazily by the ensure_connected() check above.