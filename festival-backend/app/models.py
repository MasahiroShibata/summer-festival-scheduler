from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class TeamName(str, Enum):
    TEAM_A = "A"
    TEAM_B = "B" 
    TEAM_C = "C"

class TodoStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class Role(BaseModel):
    id: str
    name: str
    team: TeamName
    description: Optional[str] = None

class Todo(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    role_id: str
    status: TodoStatus = TodoStatus.NOT_STARTED
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    assigned_to: Optional[str] = None

class Team(BaseModel):
    name: TeamName
    roles: List[Role]
    todos: List[Todo]

class ProgressSummary(BaseModel):
    team: TeamName
    total_todos: int
    completed_todos: int
    in_progress_todos: int
    completion_percentage: float

class CreateRoleRequest(BaseModel):
    name: str
    team: TeamName
    description: Optional[str] = None

class CreateTodoRequest(BaseModel):
    title: str
    description: Optional[str] = None
    role_id: str
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None

class UpdateTodoRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TodoStatus] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
