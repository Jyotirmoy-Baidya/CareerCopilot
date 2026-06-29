'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { SkillModal, type SkillForModal } from './SkillModal';

interface Props {
  skills:    SkillForModal[];
  roadmapId: string;
}

const LEVEL_COLORS = {
  beginner:     'text-green-600',
  intermediate: 'text-yellow-600',
  advanced:     'text-red-500',
};

export function RoadmapList({ skills, roadmapId }: Props) {
  const [selected,  setSelected]  = useState<SkillForModal | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(skills.filter(s => s.isCompleted).map(s => s.nodeId))
  );

  const handleComplete = (nodeId: string) => {
    setCompleted(prev => new Set([...prev, nodeId]));
  };

  return (
    <>
      <div className="space-y-2">
        {skills.map((skill, i) => {
          const isDone = completed.has(skill.nodeId);
          return (
            <button
              key={skill.nodeId}
              onClick={() => setSelected(skill)}
              className={`w-full text-left bg-white rounded-lg border px-4 py-3.5 flex items-center gap-4 hover:border-brand-500 hover:shadow-sm transition group
                ${isDone ? 'opacity-60' : ''}
              `}
            >
              {/* Step indicator */}
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${isDone ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-500'}
              `}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-gray-900 ${isDone ? 'line-through text-gray-400' : ''}`}>
                  {skill.name}
                </p>
                {skill.description && (
                  <p className="text-sm text-gray-400 mt-0.5 truncate">{skill.description}</p>
                )}
                <div className="flex gap-3 mt-1 text-xs">
                  <span className={`font-medium capitalize ${LEVEL_COLORS[skill.level]}`}>{skill.level}</span>
                  <span className="text-gray-400">{skill.estimatedHrs}h</span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 flex-shrink-0 transition" />
            </button>
          );
        })}
      </div>

      {selected && (
        <SkillModal
          skill={selected}
          roadmapId={roadmapId}
          onClose={() => setSelected(null)}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
