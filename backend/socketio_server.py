"""
Socket.IO server for real-time notifications
Run this separately from the Django app: python socketio_server.py
"""

import os

import aiohttp_cors
import socketio
from aiohttp import web
from dotenv import load_dotenv

load_dotenv()

# Create Socket.IO server with CORS explicitly configured for the frontend.
# Allow polling fallback to increase compatibility in restrictive environments.
sio = socketio.AsyncServer(
    async_mode='aiohttp',
    cors_allowed_origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    ping_timeout=60,
    ping_interval=25,
    path='/socket.io',
    transports=['polling', 'websocket'],
)

app = web.Application()
sio.attach(app)

cors = aiohttp_cors.setup(
    app,
    defaults={
            'http://localhost:5173': aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                allow_methods=['GET', 'POST', 'OPTIONS'],
                allow_headers='*',
                expose_headers='*',
            ),
            'http://127.0.0.1:5173': aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                allow_methods=['GET', 'POST', 'OPTIONS'],
                allow_headers='*',
                expose_headers='*',
            ),
            'http://localhost:3000': aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                allow_methods=['GET', 'POST', 'OPTIONS'],
                allow_headers='*',
                expose_headers='*',
            ),
    },
)

for route in list(app.router.routes()):
    try:
        cors.add(route)
    except ValueError:
        # Some routes (like the engine.io /socket.io/ resource) already
        # register an OPTIONS handler; skip adding a duplicate preflight handler.
        pass

# Store connected users
connected_users = {}


@sio.on('connect')
async def connect(sid, environ):
    """Handle client connection"""
    print('Client connected to notifications websocket')
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


@sio.on('send_notification')
async def handle_send_notification(sid, data):
    """Receive notification payloads from backend services and forward them to the right consultancy."""
    consultancy_id = data.get('consultancy_id')
    notification = data.get('notification')

    if not consultancy_id or not notification:
        print(f'[Socket.IO] Ignoring invalid send_notification payload: {data}')
        return

    delivered = False
    for client_sid, user_data in list(connected_users.items()):
        if user_data['id'] == consultancy_id and user_data['role'] == 'consultancy':
            await sio.emit('new_notification', notification, to=client_sid)
            print(f'[Socket.IO] Forwarded notification to consultancy {consultancy_id} on socket {client_sid}')
            delivered = True

    if not delivered:
        print(f'[Socket.IO] Consultancy {consultancy_id} is not currently connected; notification will be stored for later retrieval.')


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
    port = int(os.getenv('SOCKETIO_PORT', 8003))
    print(f'Socket.IO server starting on port {port}')
    print(f'Socket.IO endpoint: http://localhost:{port}/socket.io/')
    # bind to 0.0.0.0 so local docker containers or remote tools can connect
    web.run_app(app, port=port, host='0.0.0.0')
