from django.contrib.auth import get_user_model
from django.db import close_old_connections
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response

from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer

User = get_user_model()


class ChatRoomViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChatRoomSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(aspirant=user) | ChatRoom.objects.filter(consultancy=user)

    @action(detail=False, methods=['get'])
    def mine(self, request):
        queryset = self.get_queryset().order_by('-created_at')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def ensure(self, request):
        aspirant_id = request.data.get('aspirant_id')
        consultancy_id = request.data.get('consultancy_id')
        if not aspirant_id or not consultancy_id:
            return Response({'detail': 'aspirant_id and consultancy_id are required.'}, status=400)

        aspirant = get_object_or_404(User, pk=aspirant_id)
        consultancy = get_object_or_404(User, pk=consultancy_id)
        room, created = ChatRoom.objects.get_or_create(aspirant=aspirant, consultancy=consultancy)
        serializer = self.get_serializer(room)
        return Response(serializer.data, status=201 if created else 200)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def room_messages(request, room_id):
    close_old_connections()
    room = get_object_or_404(ChatRoom, pk=room_id)
    if request.user not in [room.aspirant, room.consultancy]:
        return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        messages = room.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    # POST: create a new message (fallback when WebSocket not available)
    text = (request.data.get('message') or '').strip()
    if not text:
        return Response({'detail': 'message is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        msg = Message.objects.create(room=room, sender=request.user, text=text)
        serializer = MessageSerializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        print(f"[CHAT POST] Failed to create message: {e}")
        return Response({'detail': 'Failed to create message.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def get_or_create_room_for_current_user(request):
    """Create or return a ChatRoom where the authenticated user is the aspirant.

    POST payload: { "consultancy_id": <int> }
    GET query: ?consultancy_id=<int>
    """
    aspirant = request.user

    # Allow consultancy_id from either POST body or GET querystring for flexibility
    consultancy_id = None
    if request.method == 'POST':
        consultancy_id = request.data.get('consultancy_id')
    else:
        consultancy_id = request.query_params.get('consultancy_id') or request.GET.get('consultancy_id')

    if not consultancy_id:
        return Response({'detail': 'consultancy_id is required.'}, status=400)

    try:
        consultancy = get_object_or_404(User, pk=int(consultancy_id))
    except (ValueError, TypeError):
        return Response({'detail': 'Invalid consultancy_id.'}, status=400)

    if aspirant.id == consultancy.id:
        return Response({'detail': 'You cannot start a chat with yourself.'}, status=400)

    # Use get_or_create to ensure unique room per aspirant-consultancy pair
    room, created = ChatRoom.objects.get_or_create(aspirant=aspirant, consultancy=consultancy)
    serializer = ChatRoomSerializer(room, context={'request': request})
    return Response(serializer.data, status=201 if created else 200)
