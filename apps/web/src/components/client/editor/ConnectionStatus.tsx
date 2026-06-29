'use client';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected';
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const map = {
    connected:    { color: 'bg-green-500',  label: 'Live' },
    connecting:   { color: 'bg-amber-400 animate-pulse', label: 'Connecting' },
    disconnected: { color: 'bg-gray-400',   label: 'Offline' },
  };

  const { color, label } = map[status];

  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
