import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Employee {
  id:                 number;
  first_name:         string;
  last_name:          string;
  email:              string;
  phone:              string;
  position:           string;
  department:         string;
  status:             'active'|'on_leave'|'terminated'|'suspended';
  address:            string;
  notes:              string;
  open_todos:         number;
  total_todos:        number;
  created_at:         string;
}

export interface Todo {
  id:            number;
  employee_id:   number;
  title:         string;
  description:   string;
  priority:      'low'|'medium'|'high'|'urgent';
  status:        'pending'|'in_progress'|'completed'|'cancelled';
  due_date:      string | null;
  completed_at:  string | null;
  employee_name: string;
  position:      string;
  department:    string;
  comment_count: number;
  is_overdue:    boolean;
  overdue:       boolean;
  comments:      { id: number; user_id: string; comment: string; created_at: string }[];
}

export interface Department {
  id:             number;
  name:           string;
  description:    string;
  color:          string;
  employee_count: number;
}

async function post(url: string, body?: object) {
  const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request failed');
  return json;
}

// ── Employees ──────────────────────────────────────────────────────────────
export const useEmployees = (filters?: { department?: string; status?: string; search?: string }) =>
  useQuery({ queryKey: ['employees', filters], queryFn: () => post('/api/main/dashboard/fetch/fetch-employees', filters ?? {}) });

export const useEmployeeDetail = (employeeId: number) =>
  useQuery({ queryKey: ['employee-detail', employeeId], queryFn: () => post('/api/main/dashboard/fetch/fetch-employee-detail', { employee_id: employeeId }), enabled: employeeId > 0 });

export const useDepartments = () =>
  useQuery({ queryKey: ['departments'], queryFn: () => post('/api/main/dashboard/fetch/fetch-departments').then(r => r.departments as Department[]) });

export const useAddEmployee = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Partial<Employee>) => post('/api/main/dashboard/create/add-employee', data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); qc.invalidateQueries({ queryKey: ['departments'] }); } });
};

export const useUpdateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Partial<Employee> & { id: number }) => post('/api/main/dashboard/update/update-employee', data), onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['employees'] }); qc.invalidateQueries({ queryKey: ['employee-detail', v.id] }); } });
};

export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => post('/api/main/dashboard/delete/delete-employee', { id }), onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }) });
};

// ── Todos ──────────────────────────────────────────────────────────────────
export const useTodos = (filters?: { employee_id?: number; status?: string; priority?: string; overdue?: boolean }) =>
  useQuery({ queryKey: ['todos', filters], queryFn: () => post('/api/main/dashboard/fetch/fetch-todos', filters ?? {}) });

export const useAddTodo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Todo> & { employee_id: number }) => post('/api/main/dashboard/create/add-todo', data),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['todos'] }); qc.invalidateQueries({ queryKey: ['employee-detail', v.employee_id] }); qc.invalidateQueries({ queryKey: ['employees'] }); },
  });
};

export const useUpdateTodo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Todo> & { id: number }) => post('/api/main/dashboard/update/update-todo', data),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['todos'] }); qc.invalidateQueries({ queryKey: ['employee-detail', v.employee_id] }); },
  });
};

export const useDeleteTodo = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => post('/api/main/dashboard/delete/delete-todo', { id }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['todos'] }); qc.invalidateQueries({ queryKey: ['employees'] }); } });
};

export const useAddTodoComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { todo_id: number; comment: string; employee_id?: number }) => post('/api/main/dashboard/create/add-todo-comment', data),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['todos'] }); if (v.employee_id) qc.invalidateQueries({ queryKey: ['employee-detail', v.employee_id] }); },
  });
};