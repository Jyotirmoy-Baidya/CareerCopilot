import type { DailyTask } from '@careercopliot/types';

interface TaskListProps {
  tasks: DailyTask[];
}

const statusColors: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-600',
  in_progress: 'bg-amber-100 text-amber-700',
  completed:   'bg-green-100 text-green-700',
  skipped:     'bg-red-50 text-red-500',
};

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-5 text-sm text-gray-500">
        No tasks scheduled for today. Complete your onboarding to get started.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border divide-y">
      {tasks.map(task => (
        <div key={task.id} className="p-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{task.title}</p>
            {task.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{task.estimatedMin} min</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${statusColors[task.status]}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
      ))}
    </div>
  );
}
