interface Node {
  id: string;
}

interface Edge {
  fromSkillId: string;
  toSkillId:   string;
}

// Kahn's algorithm — standard BFS-based topological sort for DAGs
export function topologicalSort(nodes: Node[], edges: Edge[]): string[] {
  const inDegree = new Map<string, number>();
  const adj      = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }

  for (const e of edges) {
    adj.get(e.fromSkillId)?.push(e.toSkillId);
    inDegree.set(e.toSkillId, (inDegree.get(e.toSkillId) ?? 0) + 1);
  }

  const queue  = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id);
  const sorted: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const neighbor of adj.get(id) ?? []) {
      const deg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) queue.push(neighbor);
    }
  }

  return sorted;
}
