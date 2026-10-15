import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

from datetime import datetime
from src.config.database import SessionLocal
from src.models import schemas

router = APIRouter(tags=["WebSockets"])

# Connection manager to track active connections per alert_id
class ConnectionManager:
    def __init__(self):
        # Maps alert_id -> list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, alert_id: int):
        await websocket.accept()
        if alert_id not in self.active_connections:
            self.active_connections[alert_id] = []
        self.active_connections[alert_id].append(websocket)

    def disconnect(self, websocket: WebSocket, alert_id: int):
        if alert_id in self.active_connections:
            self.active_connections[alert_id].remove(websocket)
            if not self.active_connections[alert_id]:
                del self.active_connections[alert_id]

    async def broadcast(self, message: dict, alert_id: int):
        if alert_id in self.active_connections:
            for connection in self.active_connections[alert_id]:
                await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@router.websocket("/ws/alerts/{alert_id}")
async def alert_websocket(websocket: WebSocket, alert_id: int):
    await manager.connect(websocket, alert_id)
    try:
        while True:
            # Receive data (e.g., chat messages or GPS updates)
            data_str = await websocket.receive_text()
            try:
                data = json.loads(data_str)
                # Persist to database if it's a chat message
                if "text" in data:
                    db = SessionLocal()
                    try:
                        sender_val = data.get("sender", "user")
                        chat_msg = schemas.ChatMessage(
                            alert_id=alert_id,
                            sender=sender_val,
                            text=data["text"],
                            timestamp=datetime.utcnow()
                        )
                        db.add(chat_msg)
                        db.commit()
                        db.refresh(chat_msg)
                        data["id"] = chat_msg.id
                        data["timestamp"] = chat_msg.timestamp.isoformat()
                    except Exception:
                        db.rollback()
                    finally:
                        db.close()
                elif "x" in data and "y" in data:
                    db = SessionLocal()
                    try:
                        alert = db.query(schemas.Alert).filter(schemas.Alert.id == alert_id).first()
                        if alert:
                            alert.last_x = data["x"]
                            alert.last_y = data["y"]
                            db.commit()
                    except Exception:
                        db.rollback()
                    finally:
                        db.close()

                # Broadcast the received data to everyone connected to this alert
                await manager.broadcast(data, alert_id)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, alert_id)
