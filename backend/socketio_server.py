"""
Socket.IO server for real-time notifications
Run this separately from the Django app: python socketio_server.py
"""

import socketio
import os
from aiohttp import web
from dotenv import load_dotenv

load_dotenv()

# Create Socket.IO server with CORS enabled
sio = socketio.AsyncServer(
    async_mode='aiohttp',
    cors_allowed_origins='*',  # Configure based on your frontend URL
    ping_timeout=60,
    ping_interval=25,
)

app = web.Application()
sio.attach(app)

# Store connected users
connected_users = {}


@sio.on('connect')
async def connect(sid, environ):
    """Handle client connection"""
    print(f'Client {sid} connected')
    connected_users[sid] = {'id': None, 'role': None}
    # send current active consultancies (for debugging)
    # await sio.emit('active_users', await get_active_users(), to=sid)


@sio.on('authenticate')
async def authenticate(sid, data):
    """Handle user authentication with user ID and role"""
    user_id = data.get('user_id')
    user_role = data.get('role')
    
    if user_id and user_role == 'consultancy':
        connected_users[sid] = {'id': user_id, 'role': user_role}
        print(f'User {user_id} (consultancy) authenticated on socket {sid}')
        await sio.emit('auth_success', {'message': 'Authenticated successfully'}, to=sid)
    else:
        # keep the connection but inform client
        await sio.emit('auth_error', {'message': 'Authentication failed'}, to=sid)


@sio.on('disconnect')
async def disconnect(sid):
    """Handle client disconnection"""
    if sid in connected_users:
        user_id = connected_users[sid].get('id')
        print(f'Client {sid} (User {user_id}) disconnected')
        del connected_users[sid]


async def emit_notification(consultancy_id, notification_data):
    """
    Emit notification to a specific consultancy
    Called from Django views
    """
    for sid, user_data in list(connected_users.items()):
        if user_data['id'] == consultancy_id and user_data['role'] == 'consultancy':
            await sio.emit('new_notification', notification_data, to=sid)
            print(f'Notification sent to consultancy {consultancy_id} on socket {sid}')


async def get_active_users():
    """Get list of currently connected consultancies"""
    return {
        sid: data for sid, data in connected_users.items()
        if data['role'] == 'consultancy'
    }


if __name__ == '__main__':
    port = int(os.getenv('SOCKETIO_PORT', 5000))
    print(f'Socket.IO server starting on port {port}')
    web.run_app(app, port=port)
