from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import json
from datetime import datetime

from .models import (
    TeamName, Role, Todo, ProgressSummary, 
    CreateRoleRequest, CreateTodoRequest, UpdateTodoRequest
)
from .database import db

app = FastAPI(title="Summer Festival Schedule Manager")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/teams")
async def get_teams():
    return [{"name": team.value} for team in TeamName]

@app.get("/api/teams/{team}/roles", response_model=List[Role])
async def get_team_roles(team: TeamName):
    return db.get_roles_by_team(team)

@app.post("/api/roles", response_model=Role)
async def create_role(role_request: CreateRoleRequest):
    role = db.create_role(
        name=role_request.name,
        team=role_request.team,
        description=role_request.description
    )
    await manager.broadcast(json.dumps({
        "type": "role_created",
        "data": role.dict()
    }))
    return role

@app.get("/api/roles/{role_id}/todos", response_model=List[Todo])
async def get_role_todos(role_id: str):
    return db.get_todos_by_role(role_id)

@app.get("/api/teams/{team}/todos", response_model=List[Todo])
async def get_team_todos(team: TeamName):
    return db.get_todos_by_team(team)

@app.post("/api/todos", response_model=Todo)
async def create_todo(todo_request: CreateTodoRequest):
    todo = db.create_todo(
        title=todo_request.title,
        description=todo_request.description,
        role_id=todo_request.role_id,
        due_date=todo_request.due_date,
        assigned_to=todo_request.assigned_to
    )
    await manager.broadcast(json.dumps({
        "type": "todo_created",
        "data": todo.dict(),
        "timestamp": datetime.now().isoformat()
    }))
    return todo

@app.put("/api/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: str, todo_request: UpdateTodoRequest):
    try:
        updates = {k: v for k, v in todo_request.dict().items() if v is not None}
        todo = db.update_todo(todo_id, **updates)
        await manager.broadcast(json.dumps({
            "type": "todo_updated",
            "data": todo.dict(),
            "timestamp": datetime.now().isoformat()
        }))
        return todo
    except ValueError:
        raise HTTPException(status_code=404, detail="Todo not found")

@app.delete("/api/todos/{todo_id}")
async def delete_todo(todo_id: str):
    if db.delete_todo(todo_id):
        await manager.broadcast(json.dumps({
            "type": "todo_deleted",
            "todo_id": todo_id,
            "timestamp": datetime.now().isoformat()
        }))
        return {"message": "Todo deleted successfully"}
    raise HTTPException(status_code=404, detail="Todo not found")

@app.get("/api/progress", response_model=List[ProgressSummary])
async def get_progress():
    progress = []
    for team in TeamName:
        todos = db.get_todos_by_team(team)
        total = len(todos)
        completed = len([t for t in todos if t.status == "completed"])
        in_progress = len([t for t in todos if t.status == "in_progress"])
        
        progress.append(ProgressSummary(
            team=team,
            total_todos=total,
            completed_todos=completed,
            in_progress_todos=in_progress,
            completion_percentage=round((completed / total * 100) if total > 0 else 0, 1)
        ))
    
    return progress

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
