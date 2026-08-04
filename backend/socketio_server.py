"""
Socket.IO server for real-time notifications
Run this separately from the Django app: python socketio_server.py
"""

import os
from urllib.parse import parse_qs

import aiohttp_cors
import django
import socketio
from aiohttp import web
from asgiref.sync import sync_to_async
from dotenv import load_dotenv

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'visa_backend.settings')
django.setup()

from django.conf import settings
from django.db import close_old_connections, connections
from rest_framework_simplejwt.backends import TokenBackend
from authentication.models import User
from chat.models import ChatRoom, Message

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


def parse_query_params(environ):
    query = environ.get('QUERY_STRING', '') or ''
    return {key: values[0] for key, values in parse_qs(query).items()}


def ensure_database_connection():
    close_old_connections()
    connections['default'].ensure_connection()


@sync_to_async
def get_user_by_id(user_id):
    ensure_database_connection()
    return User.objects.filter(pk=user_id).first()


@sync_to_async
def get_room_by_id(room_id):
    ensure_database_connection()
    return ChatRoom.objects.filter(pk=room_id).first()


@sync_to_async
def save_chat_message(room, sender, text):
    ensure_database_connection()
    return Message.objects.create(room=room, sender=sender, text=text)


@sync_to_async
def authenticate_token_sync(token):
    if not token:
        return None

    try:
        ensure_database_connection()
        backend = TokenBackend(
            algorithm=settings.SIMPLE_JWT.get('ALGORITHM', 'HS256'),
            signing_key=settings.SECRET_KEY,
        )
        validated = backend.decode(token, verify=True)
        user_id = validated.get('user_id') or validated.get('id')
        if not user_id:
            return None
        return User.objects.filter(pk=user_id).first()
    except Exception as exc:
        print(f'[Socket.IO] JWT authentication failed: {exc}')
        return None


async def authenticate_token(token):
    return await authenticate_token_sync(token)


@sio.on('connect')
async def connect(sid, environ):
    """Handle client connection"""
    params = parse_query_params(environ)
    token = params.get('token') or params.get('access_token') or params.get('accessToken')
    room_id = params.get('room_id')
    user = await authenticate_token(token)

    if user:
        connected_users[sid] = {'id': user.id, 'role': getattr(user, 'role', None), 'rooms': set()}
        await sio.enter_room(sid, f'user_{user.id}')
        if getattr(user, 'role', None) == 'consultancy':
            await sio.enter_room(sid, f'consultancy_{user.id}')
        if room_id and room_id.isdigit():
            await sio.enter_room(sid, f'chat_{room_id}')
            connected_users[sid]['rooms'].add(int(room_id))
        print(f'Client {sid} connected as user {user.id} ({getattr(user, "role", None)}) and joined user_{user.id}')
    else:
        connected_users[sid] = {'id': None, 'role': None, 'rooms': set()}
        print(f'Client connected to notifications websocket (unauthenticated): {sid}')

    # send current active consultancies (for debugging)
    # await sio.emit('active_users', await get_active_users(), to=sid)


@sio.on('authenticate')
async def authenticate(sid, data):
    """Handle user authentication with user ID and role"""
    user_id = data.get('user_id')
    user_role = data.get('role')

    if not user_id:
        await sio.emit('auth_error', {'message': 'Authentication failed'}, to=sid)
        return

    connected_users[sid] = {'id': int(user_id), 'role': user_role, 'rooms': set()}
    await sio.enter_room(sid, f'user_{user_id}')

    if user_role == 'consultancy':
        room_name = f'consultancy_{user_id}'
        await sio.enter_room(sid, room_name)
        print(f'User {user_id} (consultancy) authenticated on socket {sid} and joined room {room_name}')
    else:
        print(f'User {user_id} ({user_role}) authenticated on socket {sid} and joined room user_{user_id}')

    await sio.emit('auth_success', {'message': 'Authenticated successfully'}, to=sid)


@sio.on('join_room')
async def handle_join_room(sid, data):
    if not isinstance(data, dict):
        return

    room_id_raw = data.get('room_id') or data.get('room')
    if room_id_raw is None:
        return

    try:
        clean_str = str(room_id_raw).replace('chat_', '').strip()
        room_id = int(clean_str)
    except (TypeError, ValueError):
        return

    user_data = connected_users.get(sid, {})
    user_id = user_data.get('id')

    if not user_id and data.get('token'):
        user = await authenticate_token(data.get('token'))
        if user:
            user_id = user.id
            connected_users[sid] = {'id': user.id, 'role': getattr(user, 'role', None), 'rooms': set()}
            await sio.enter_room(sid, f'user_{user.id}')

    if not user_id:
        print(f"[Socket.IO WARNING] Unauthenticated socket {sid} tried to join room {room_id}")
        await sio.emit('auth_error', {'message': 'Authentication required for chat room join'}, to=sid)
        return

    user = await get_user_by_id(user_id)
    room = await get_room_by_id(room_id)

    if room and user in [room.aspirant, room.consultancy]:
        room_name = f'chat_{room_id}'
        await sio.enter_room(sid, room_name)
        user_data.setdefault('rooms', set()).add(room_id)
        print(f'[Socket.IO SUCCESS] User {user.id} joined {room_name} (sid={sid})')
    else:
        print(f'[Socket.IO] User {user_id} not allowed in room {room_id}')
        await sio.emit('auth_error', {'message': 'You are not a participant in this chat room'}, to=sid)

@sio.on('join_user_channel')
async def handle_join_user_channel(sid, data):
    user_id = data.get('user_id')
    if not user_id:
        return

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return

    user_data = connected_users.get(sid)
    if not user_data or user_data.get('id') != user_id:
        return

    await sio.enter_room(sid, f'user_{user_id}')
    print(f'User {user_id} joined user_{user_id}')


@sio.on('send_message')
async def handle_send_message(sid, data):
    if not isinstance(data, dict):
        return

    room_id_raw = data.get('room_id') or data.get('chat_room')
    if room_id_raw is None:
        return

    try:
        clean_str = str(room_id_raw).replace('chat_', '').strip()
        room_id = int(clean_str)
    except (TypeError, ValueError):
        return

    user_data = connected_users.get(sid, {})
    user_id = user_data.get('id')
    try:
        user = await get_user_by_id(user_id) if user_id else None
        room = await get_room_by_id(room_id)
    except Exception as exc:
        print(f'[Socket.IO] Failed to load chat context for message send: {exc}')
        user = None
        room = None

    recipient_id = None
    if room and user:
        if room.aspirant_id == user.id:
            recipient_id = room.consultancy_id
        elif room.consultancy_id == user.id:
            recipient_id = room.aspirant_id

    room_name = f'chat_{room_id}'
    message_text = (data.get('message') or data.get('content') or '').strip()

    payload = {
        'id': data.get('message_id') or data.get('id'),
        'message_id': data.get('message_id') or data.get('id'),
        'sender_id': user_id or data.get('sender_id', 0),
        'message': message_text,
        'content': message_text,
        'room_id': room_id,
        'timestamp': data.get('timestamp')
    }

    # Always broadcast to room_name (chat_1)
    await sio.emit('receive_message', payload, room=room_name)
    
    # Also emit directly to recipient user room if known
    if recipient_id:
        await sio.emit('receive_message', payload, room=f'user_{recipient_id}')
        
    print(f'[Socket.IO] Broadcast message to room {room_name} & user_{recipient_id}')
@sio.on('disconnect')
async def disconnect(sid):
    """Handle client disconnection"""
    if sid in connected_users:
        user_data = connected_users[sid]
        user_id = user_data.get('id')
        rooms = user_data.get('rooms') or set()
        for room_id in rooms:
            await sio.leave_room(sid, f'chat_{room_id}')
        if user_id:
            await sio.leave_room(sid, f'user_{user_id}')
            if user_data.get('role') == 'consultancy':
                await sio.leave_room(sid, f'consultancy_{user_id}')
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

    room_name = f'consultancy_{consultancy_id}'
    await sio.emit('new_notification', notification, room=room_name)
    await sio.emit('notification', notification, room=room_name)
    await sio.emit('new_notification', notification, room=f'user_{consultancy_id}')
    print(f'[Socket.IO] Forwarded notification to consultancy {consultancy_id} room {room_name} and user_{consultancy_id}')


@sio.on('send_notification_to_user')
async def handle_send_notification_to_user(sid, data):
    """Receive a user-scoped notification payload and broadcast it to that user's room."""
    user_id = data.get('user_id')
    notification = data.get('notification')

    if not user_id or not notification:
        print(f'[Socket.IO] Ignoring invalid send_notification_to_user payload: {data}')
        return

    room_name = f'user_{user_id}'
    await sio.emit('new_notification', notification, room=room_name)
    await sio.emit('notification', notification, room=room_name)
    print(f'[Socket.IO] Forwarded notification to user room {room_name}')


@sio.on('mark_notifications_read')
async def handle_mark_notifications_read(sid, data):
    consultancy_id = data.get('consultancy_id')
    if not consultancy_id:
        print(f'[Socket.IO] Ignoring invalid mark_notifications_read payload: {data}')
        return

    room_name = f'consultancy_{consultancy_id}'
    await sio.emit('notifications_read', {'unread_count': 0}, room=room_name)
    await sio.emit('notifications_read', {'unread_count': 0}, room=f'user_{consultancy_id}')
    print(f'[Socket.IO] Broadcast notifications_read to consultancy {consultancy_id} room {room_name} and user_{consultancy_id}')


async def emit_notification(consultancy_id, notification_data):
    """
    Emit notification to a specific consultancy
    Called from Django views
    """
    for sid, user_data in list(connected_users.items()):
        if user_data['id'] == consultancy_id and user_data['role'] == 'consultancy':
            await sio.emit('new_notification', notification_data, to=sid)
            await sio.emit('notification', notification_data, to=sid)
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
