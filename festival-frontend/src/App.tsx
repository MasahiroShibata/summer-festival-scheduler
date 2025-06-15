import { useState, useEffect } from 'react'
import { Calendar, BarChart3, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import './App.css'

interface Role {
  id: string
  name: string
  team: string
  description?: string
}

interface Todo {
  id: string
  title: string
  description?: string
  role_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  due_date?: string
  created_at: string
  updated_at: string
  assigned_to?: string
}

interface ProgressSummary {
  team: string
  total_todos: number
  completed_todos: number
  in_progress_todos: number
  completion_percentage: number
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [selectedTeam, setSelectedTeam] = useState<string>('A')
  const [roles, setRoles] = useState<Role[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [progress, setProgress] = useState<ProgressSummary[]>([])
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [newRole, setNewRole] = useState({ name: '', description: '' })
  const [newTodo, setNewTodo] = useState({ title: '', description: '', role_id: '', due_date: '', assigned_to: '' })

  useEffect(() => {
    fetchRoles()
    fetchTodos()
    fetchProgress()
    setupWebSocket()
    
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [selectedTeam])

  const setupWebSocket = () => {
    const websocket = new WebSocket(`${API_URL.replace('http', 'ws')}/ws`)
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'todo_updated' || data.type === 'todo_created' || data.type === 'todo_deleted') {
        fetchTodos()
        fetchProgress()
      }
    }
    
    setWs(websocket)
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/teams/${selectedTeam}/roles`)
      const data = await response.json()
      setRoles(data)
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/teams/${selectedTeam}/todos`)
      const data = await response.json()
      setTodos(data)
    } catch (error) {
      console.error('Failed to fetch todos:', error)
    }
  }

  const fetchProgress = async () => {
    try {
      const response = await fetch(`${API_URL}/api/progress`)
      const data = await response.json()
      setProgress(data)
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    }
  }

  const createRole = async () => {
    try {
      const response = await fetch(`${API_URL}/api/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRole, team: selectedTeam })
      })
      if (response.ok) {
        setNewRole({ name: '', description: '' })
        setIsAddingRole(false)
        fetchRoles()
      }
    } catch (error) {
      console.error('Failed to create role:', error)
    }
  }

  const createTodo = async () => {
    try {
      const todoData = {
        ...newTodo,
        due_date: newTodo.due_date ? new Date(newTodo.due_date).toISOString() : null
      }
      const response = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData)
      })
      if (response.ok) {
        setNewTodo({ title: '', description: '', role_id: '', due_date: '', assigned_to: '' })
        setIsAddingTodo(false)
        fetchTodos()
      }
    } catch (error) {
      console.error('Failed to create todo:', error)
    }
  }

  const updateTodoStatus = async (todoId: string, status: string) => {
    try {
      await fetch(`${API_URL}/api/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchTodos()
    } catch (error) {
      console.error('Failed to update todo:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了'
      case 'in_progress': return '進行中'
      default: return '未開始'
    }
  }

  const getRoleById = (roleId: string) => {
    return roles.find(role => role.id === roleId)
  }

  const filteredTodos = selectedRole 
    ? todos.filter(todo => todo.role_id === selectedRole)
    : todos

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">夏祭りスケジュール管理</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">チームA</SelectItem>
                  <SelectItem value="B">チームB</SelectItem>
                  <SelectItem value="C">チームC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">チーム{selectedTeam}の役割</h2>
              <Dialog open={isAddingRole} onOpenChange={setIsAddingRole}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    役割を追加
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新しい役割を追加</DialogTitle>
                    <DialogDescription>チーム{selectedTeam}の新しい役割を作成します</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="role-name">役割名</Label>
                      <Input
                        id="role-name"
                        value={newRole.name}
                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                        placeholder="例: 資材調達"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role-description">説明</Label>
                      <Textarea
                        id="role-description"
                        value={newRole.description}
                        onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                        placeholder="役割の詳細説明"
                      />
                    </div>
                    <Button onClick={createRole} className="w-full">作成</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <Card 
                  key={role.id} 
                  className={`cursor-pointer transition-colors ${selectedRole === role.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedRole(selectedRole === role.id ? '' : role.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    {role.description && (
                      <CardDescription>{role.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        ToDo: {todos.filter(todo => todo.role_id === role.id).length}件
                      </span>
                      <Badge variant="outline">チーム{selectedTeam}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedRole ? `${getRoleById(selectedRole)?.name}のToDo` : `チーム${selectedTeam}の全ToDo`}
              </h2>
              <Dialog open={isAddingTodo} onOpenChange={setIsAddingTodo}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    ToDoを追加
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新しいToDoを追加</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="todo-title">タイトル</Label>
                      <Input
                        id="todo-title"
                        value={newTodo.title}
                        onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                        placeholder="ToDoのタイトル"
                      />
                    </div>
                    <div>
                      <Label htmlFor="todo-role">役割</Label>
                      <Select value={newTodo.role_id} onValueChange={(value) => setNewTodo({ ...newTodo, role_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="役割を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="todo-description">説明</Label>
                      <Textarea
                        id="todo-description"
                        value={newTodo.description}
                        onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                        placeholder="詳細説明"
                      />
                    </div>
                    <div>
                      <Label htmlFor="todo-due-date">期限</Label>
                      <Input
                        id="todo-due-date"
                        type="date"
                        value={newTodo.due_date}
                        onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="todo-assigned">担当者</Label>
                      <Input
                        id="todo-assigned"
                        value={newTodo.assigned_to}
                        onChange={(e) => setNewTodo({ ...newTodo, assigned_to: e.target.value })}
                        placeholder="担当者名"
                      />
                    </div>
                    <Button onClick={createTodo} className="w-full">作成</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {filteredTodos.map((todo) => (
                <Card key={todo.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{todo.title}</h3>
                          <Badge className={getStatusColor(todo.status)}>
                            {getStatusText(todo.status)}
                          </Badge>
                        </div>
                        {todo.description && (
                          <p className="text-gray-600 text-sm mb-2">{todo.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>役割: {getRoleById(todo.role_id)?.name}</span>
                          {todo.assigned_to && <span>担当: {todo.assigned_to}</span>}
                          {todo.due_date && (
                            <span>期限: {new Date(todo.due_date).toLocaleDateString('ja-JP')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select value={todo.status} onValueChange={(value) => updateTodoStatus(todo.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started">未開始</SelectItem>
                            <SelectItem value="in_progress">進行中</SelectItem>
                            <SelectItem value="completed">完了</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>全体進捗</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progress.map((teamProgress) => (
                  <div key={teamProgress.team}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">チーム{teamProgress.team}</span>
                      <span className="text-sm text-gray-500">
                        {teamProgress.completion_percentage}%
                      </span>
                    </div>
                    <Progress value={teamProgress.completion_percentage} className="mb-2" />
                    <div className="text-xs text-gray-500">
                      完了: {teamProgress.completed_todos} / 
                      進行中: {teamProgress.in_progress_todos} / 
                      全体: {teamProgress.total_todos}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>チーム情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>現在のチーム</span>
                    <Badge>チーム{selectedTeam}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>役割数</span>
                    <span>{roles.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ToDo数</span>
                    <span>{todos.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>完了率</span>
                    <span>
                      {todos.length > 0 
                        ? Math.round((todos.filter(t => t.status === 'completed').length / todos.length) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
