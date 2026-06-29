'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { updateTaskStatus } from '@/lib/offline/local-operations';
import type { DailyTask } from '@careercopliot/types';

interface TaskBoardProps {
  initialTasks: DailyTask[];
}

const statusLabels: Record<string, string> = {
  pending:     'To do',
  in_progress: 'In progress',
  completed:   'Done',
  skipped:     'Skipped',
};

function AddTaskForm({ onAdd }: { onAdd: (task: DailyTask) => void }) {
  const [open,   setOpen]   = useState(false);
  const [title,  setTitle]  = useState('');
  const [mins,   setMins]   = useState('30');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res  = await fetch('/api/tasks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title: title.trim(), estimatedMin: parseInt(mins) || 30 }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to add task'); return; }
      onAdd(data.task);
      setTitle('');
      setMins('30');
      setOpen(false);
    } catch {
      toast.error('Network error — could not add task');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md py-2 border border-dashed border-gray-200 transition-colors"
      >
        + Add task
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 bg-white rounded-md p-3 border border-brand-500 shadow-sm space-y-2">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 shrink-0">Est. mins</label>
        <input
          type="number"
          value={mins}
          onChange={e => setMins(e.target.value)}
          min={1}
          max={480}
          className="w-20 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="text-xs px-3 py-1 rounded border border-gray-200 hover:bg-gray-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="text-xs px-3 py-1 rounded bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
    </form>
  );
}

export function TaskBoard({ initialTasks }: TaskBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);

  const markStatus = async (taskId: string, status: DailyTask['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    await updateTaskStatus(taskId, status);
  };

  const addTask = (task: DailyTask) => setTasks(prev => [task, ...prev]);

  const columns: DailyTask['status'][] = ['pending', 'in_progress', 'completed'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map(col => (
        <div key={col} className="bg-gray-50 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">{statusLabels[col]}</h3>
          <div className="space-y-2">
            {tasks.filter(t => t.status === col).map(task => (
              <div key={task.id} className="bg-white rounded-md p-3 shadow-sm border border-gray-100">
                <p className="text-sm font-medium">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">{task.estimatedMin} min</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {(['pending', 'in_progress', 'completed', 'skipped'] as const).filter(s => s !== task.status).map(s => (
                    <button
                      key={s}
                      onClick={() => markStatus(task.id, s)}
                      className="text-xs px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-100"
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === col).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Nothing here</p>
            )}
          </div>
          {col === 'pending' && <AddTaskForm onAdd={addTask} />}
        </div>
      ))}
    </div>
  );
}
