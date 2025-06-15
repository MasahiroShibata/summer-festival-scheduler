from typing import Dict, List, Optional
from datetime import datetime
import uuid
from .models import Role, Todo, TeamName, TodoStatus

class InMemoryDatabase:
    def __init__(self):
        self.roles: Dict[str, Role] = {}
        self.todos: Dict[str, Todo] = {}
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        sample_roles = [
            {"name": "資材調達", "team": TeamName.TEAM_A, "description": "祭りに必要な資材の調達を担当"},
            {"name": "資金調達", "team": TeamName.TEAM_A, "description": "祭りの資金調達を担当"},
            {"name": "ボランティア連絡調整", "team": TeamName.TEAM_B, "description": "ボランティアとの連絡調整を担当"},
            {"name": "会場設営", "team": TeamName.TEAM_B, "description": "祭り会場の設営を担当"},
            {"name": "広報・宣伝", "team": TeamName.TEAM_C, "description": "祭りの広報・宣伝活動を担当"},
            {"name": "安全管理", "team": TeamName.TEAM_C, "description": "祭りの安全管理を担当"},
        ]
        
        for role_data in sample_roles:
            role_id = str(uuid.uuid4())
            role = Role(id=role_id, **role_data)
            self.roles[role_id] = role
        
        sample_todos = [
            {"title": "テント10張りの手配", "role_id": list(self.roles.keys())[0], "due_date": datetime(2025, 7, 15)},
            {"title": "音響機材のレンタル予約", "role_id": list(self.roles.keys())[0], "due_date": datetime(2025, 7, 20)},
            {"title": "スポンサー企業への営業", "role_id": list(self.roles.keys())[1], "due_date": datetime(2025, 7, 10)},
            {"title": "ボランティア募集チラシ作成", "role_id": list(self.roles.keys())[2], "due_date": datetime(2025, 7, 5)},
            {"title": "会場レイアウト図作成", "role_id": list(self.roles.keys())[3], "due_date": datetime(2025, 7, 25)},
            {"title": "SNSでの告知開始", "role_id": list(self.roles.keys())[4], "due_date": datetime(2025, 6, 30)},
        ]
        
        for todo_data in sample_todos:
            todo_id = str(uuid.uuid4())
            now = datetime.now()
            todo = Todo(
                id=todo_id,
                created_at=now,
                updated_at=now,
                **todo_data
            )
            self.todos[todo_id] = todo
    
    def get_roles_by_team(self, team: TeamName) -> List[Role]:
        return [role for role in self.roles.values() if role.team == team]
    
    def get_todos_by_role(self, role_id: str) -> List[Todo]:
        return [todo for todo in self.todos.values() if todo.role_id == role_id]
    
    def get_todos_by_team(self, team: TeamName) -> List[Todo]:
        team_role_ids = {role.id for role in self.roles.values() if role.team == team}
        return [todo for todo in self.todos.values() if todo.role_id in team_role_ids]
    
    def create_role(self, name: str, team: TeamName, description: Optional[str] = None) -> Role:
        role_id = str(uuid.uuid4())
        role = Role(id=role_id, name=name, team=team, description=description)
        self.roles[role_id] = role
        return role
    
    def create_todo(self, title: str, role_id: str, description: Optional[str] = None, 
                   due_date: Optional[datetime] = None, assigned_to: Optional[str] = None) -> Todo:
        todo_id = str(uuid.uuid4())
        now = datetime.now()
        todo = Todo(
            id=todo_id,
            title=title,
            description=description,
            role_id=role_id,
            due_date=due_date,
            assigned_to=assigned_to,
            created_at=now,
            updated_at=now
        )
        self.todos[todo_id] = todo
        return todo
    
    def update_todo(self, todo_id: str, **updates) -> Todo:
        if todo_id not in self.todos:
            raise ValueError("Todo not found")
        
        todo = self.todos[todo_id]
        for key, value in updates.items():
            if value is not None and hasattr(todo, key):
                setattr(todo, key, value)
        
        todo.updated_at = datetime.now()
        return todo
    
    def delete_todo(self, todo_id: str) -> bool:
        if todo_id in self.todos:
            del self.todos[todo_id]
            return True
        return False
    
    def update_role(self, role_id: str, **updates) -> Role:
        if role_id not in self.roles:
            raise ValueError("Role not found")
        
        role = self.roles[role_id]
        for key, value in updates.items():
            if value is not None and hasattr(role, key):
                setattr(role, key, value)
        
        return role

db = InMemoryDatabase()
