import { db } from '../client';
import { skillNodes, skillEdges } from '../schema';

// Full Stack Developer path
const fullstackSkills = [
  { slug: 'html',             name: 'HTML',                   description: 'Structure of web pages', category: 'fullstack', level: 'beginner' as const,      estimatedHrs: 8  },
  { slug: 'css',              name: 'CSS',                    description: 'Styling web pages', category: 'fullstack', level: 'beginner' as const,      estimatedHrs: 12 },
  { slug: 'javascript',       name: 'JavaScript',             description: 'Core web scripting language', category: 'fullstack', level: 'beginner' as const,      estimatedHrs: 40 },
  { slug: 'typescript',       name: 'TypeScript',             description: 'Typed superset of JavaScript', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 20 },
  { slug: 'react',            name: 'React',                  description: 'UI component library by Meta', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 30 },
  { slug: 'nextjs',           name: 'Next.js',                description: 'React framework with SSR and routing', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 25 },
  { slug: 'nodejs',           name: 'Node.js',                description: 'JavaScript runtime for servers', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 25 },
  { slug: 'express',          name: 'Express.js',             description: 'Minimal Node.js web framework', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 15 },
  { slug: 'postgresql',       name: 'PostgreSQL',             description: 'Open-source relational database', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 20 },
  { slug: 'sql',              name: 'SQL',                    description: 'Database query language', category: 'fullstack', level: 'beginner' as const,      estimatedHrs: 15 },
  { slug: 'rest-api',         name: 'REST API Design',        description: 'Building and consuming REST APIs', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 15 },
  { slug: 'git',              name: 'Git',                    description: 'Version control system', category: 'fullstack', level: 'beginner' as const,      estimatedHrs: 8  },
  { slug: 'docker',           name: 'Docker',                 description: 'Containerisation platform', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 15 },
  { slug: 'system-design',    name: 'System Design',          description: 'Designing scalable distributed systems', category: 'fullstack', level: 'advanced' as const,    estimatedHrs: 30 },
  { slug: 'deployment',       name: 'Deployment',             description: 'Deploying apps to production', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 10 },
  { slug: 'testing-js',       name: 'Testing (JS)',           description: 'Unit and integration tests with Jest', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 15 },
  { slug: 'tailwindcss',      name: 'Tailwind CSS',           description: 'Utility-first CSS framework', category: 'fullstack', level: 'beginner' as const,      estimatedHrs: 8  },
  { slug: 'redis',            name: 'Redis',                  description: 'In-memory data store for caching and queues', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 10 },
  { slug: 'auth-jwt',         name: 'Authentication & JWT',  description: 'Securing apps with JWT and sessions', category: 'fullstack', level: 'intermediate' as const,  estimatedHrs: 10 },
  { slug: 'websockets',       name: 'WebSockets',             description: 'Real-time bidirectional communication', category: 'fullstack', level: 'advanced' as const,    estimatedHrs: 12 },
];

// Frontend path
const frontendSkills = [
  { slug: 'responsive-design', name: 'Responsive Design', description: 'Building layouts that work on all screen sizes', category: 'frontend', level: 'beginner' as const, estimatedHrs: 10 },
  { slug: 'accessibility',     name: 'Web Accessibility', description: 'Making sites usable for everyone', category: 'frontend', level: 'intermediate' as const, estimatedHrs: 8 },
  { slug: 'react-query',       name: 'TanStack Query',    description: 'Data fetching and caching for React', category: 'frontend', level: 'intermediate' as const, estimatedHrs: 12 },
  { slug: 'zustand',           name: 'State Management',  description: 'Managing global state in React apps', category: 'frontend', level: 'intermediate' as const, estimatedHrs: 10 },
  { slug: 'vite',              name: 'Vite',              description: 'Fast frontend build tool', category: 'frontend', level: 'beginner' as const, estimatedHrs: 5 },
  { slug: 'figma',             name: 'Figma Basics',      description: 'Reading and working from design files', category: 'frontend', level: 'beginner' as const, estimatedHrs: 6 },
  { slug: 'performance-web',   name: 'Web Performance',   description: 'Core Web Vitals, lazy loading, code splitting', category: 'frontend', level: 'advanced' as const, estimatedHrs: 12 },
];

// Backend path
const backendSkills = [
  { slug: 'microservices',   name: 'Microservices',      description: 'Splitting apps into independent services', category: 'backend', level: 'advanced' as const,    estimatedHrs: 20 },
  { slug: 'message-queues',  name: 'Message Queues',     description: 'Async processing with BullMQ or RabbitMQ', category: 'backend', level: 'advanced' as const,    estimatedHrs: 15 },
  { slug: 'graphql',         name: 'GraphQL',            description: 'Query language for APIs', category: 'backend', level: 'intermediate' as const,  estimatedHrs: 15 },
  { slug: 'grpc',            name: 'gRPC',               description: 'High-performance RPC framework', category: 'backend', level: 'advanced' as const,    estimatedHrs: 12 },
  { slug: 'caching',         name: 'Caching Strategies', description: 'Cache-aside, write-through, TTL patterns', category: 'backend', level: 'intermediate' as const,  estimatedHrs: 8 },
  { slug: 'database-design', name: 'Database Design',    description: 'Normalisation, indexes, query optimisation', category: 'backend', level: 'intermediate' as const,  estimatedHrs: 20 },
];

// DevOps path
const devopsSkills = [
  { slug: 'linux',       name: 'Linux Basics',    description: 'Shell, file system, permissions', category: 'devops', level: 'beginner' as const,     estimatedHrs: 15 },
  { slug: 'docker-adv',  name: 'Docker Advanced', description: 'Multi-stage builds, Compose, networking', category: 'devops', level: 'intermediate' as const, estimatedHrs: 15 },
  { slug: 'kubernetes',  name: 'Kubernetes',      description: 'Container orchestration at scale', category: 'devops', level: 'advanced' as const,    estimatedHrs: 30 },
  { slug: 'ci-cd',       name: 'CI/CD Pipelines', description: 'GitHub Actions, automated testing and deploy', category: 'devops', level: 'intermediate' as const, estimatedHrs: 12 },
  { slug: 'monitoring',  name: 'Monitoring',      description: 'Prometheus, Grafana, alerting', category: 'devops', level: 'advanced' as const,    estimatedHrs: 12 },
  { slug: 'terraform',   name: 'Terraform',       description: 'Infrastructure as code', category: 'devops', level: 'advanced' as const,    estimatedHrs: 20 },
  { slug: 'aws-basics',  name: 'AWS Basics',      description: 'EC2, S3, RDS, IAM fundamentals', category: 'devops', level: 'intermediate' as const, estimatedHrs: 20 },
];

// Data Science path
const dataSkills = [
  { slug: 'python',         name: 'Python',             description: 'Core language for data science', category: 'data-science', level: 'beginner' as const,     estimatedHrs: 30 },
  { slug: 'numpy',          name: 'NumPy',              description: 'Numerical computing in Python', category: 'data-science', level: 'intermediate' as const, estimatedHrs: 10 },
  { slug: 'pandas',         name: 'Pandas',             description: 'Data manipulation and analysis', category: 'data-science', level: 'intermediate' as const, estimatedHrs: 15 },
  { slug: 'matplotlib',     name: 'Matplotlib',         description: 'Data visualisation', category: 'data-science', level: 'intermediate' as const, estimatedHrs: 8 },
  { slug: 'sklearn',        name: 'Scikit-learn',       description: 'Machine learning library', category: 'data-science', level: 'intermediate' as const, estimatedHrs: 20 },
  { slug: 'sql-analytics',  name: 'SQL for Analytics',  description: 'Window functions, CTEs, aggregations', category: 'data-science', level: 'intermediate' as const, estimatedHrs: 15 },
  { slug: 'statistics',     name: 'Statistics',         description: 'Probability, distributions, hypothesis testing', category: 'data-science', level: 'intermediate' as const, estimatedHrs: 20 },
  { slug: 'deep-learning',  name: 'Deep Learning',      description: 'Neural networks with PyTorch or TensorFlow', category: 'data-science', level: 'advanced' as const,    estimatedHrs: 40 },
];

const allSkills = [...fullstackSkills, ...frontendSkills, ...backendSkills, ...devopsSkills, ...dataSkills];

// Edges: [prerequisite slug, unlocks slug]
const edges: [string, string][] = [
  // Fullstack chain
  ['html',           'css'],
  ['css',            'javascript'],
  ['javascript',     'typescript'],
  ['javascript',     'react'],
  ['javascript',     'nodejs'],
  ['typescript',     'react'],
  ['typescript',     'nextjs'],
  ['react',          'nextjs'],
  ['nodejs',         'express'],
  ['sql',            'postgresql'],
  ['express',        'rest-api'],
  ['postgresql',     'rest-api'],
  ['javascript',     'git'],
  ['docker',         'deployment'],
  ['rest-api',       'auth-jwt'],
  ['auth-jwt',       'system-design'],
  ['redis',          'system-design'],
  ['javascript',     'testing-js'],
  ['css',            'tailwindcss'],
  ['nodejs',         'redis'],
  ['nodejs',         'websockets'],

  // Frontend chain
  ['css',            'responsive-design'],
  ['react',          'react-query'],
  ['react',          'zustand'],
  ['html',           'accessibility'],
  ['responsive-design', 'accessibility'],
  ['javascript',     'vite'],
  ['react',          'performance-web'],

  // Backend chain
  ['rest-api',       'microservices'],
  ['redis',          'message-queues'],
  ['rest-api',       'graphql'],
  ['microservices',  'grpc'],
  ['redis',          'caching'],
  ['postgresql',     'database-design'],

  // DevOps chain
  ['git',            'linux'],
  ['docker',         'docker-adv'],
  ['linux',          'docker-adv'],
  ['docker-adv',     'kubernetes'],
  ['git',            'ci-cd'],
  ['kubernetes',     'monitoring'],
  ['aws-basics',     'terraform'],

  // Data Science chain
  ['python',         'numpy'],
  ['numpy',          'pandas'],
  ['pandas',         'matplotlib'],
  ['pandas',         'sklearn'],
  ['sql',            'sql-analytics'],
  ['statistics',     'sklearn'],
  ['sklearn',        'deep-learning'],
];

export async function seedSkills() {
  console.log('Seeding skill nodes...');

  // Insert all skills
  const inserted = await db
    .insert(skillNodes)
    .values(allSkills)
    .onConflictDoNothing()
    .returning();

  console.log(`Inserted ${inserted.length} skill nodes`);

  // Build slug -> id map
  const all = await db.select().from(skillNodes);
  const slugMap = new Map(all.map(s => [s.slug, s.id]));

  // Insert edges
  const edgeValues = edges
    .map(([from, to]) => {
      const fromId = slugMap.get(from);
      const toId   = slugMap.get(to);
      if (!fromId || !toId) {
        console.warn(`Skipping edge ${from} -> ${to} — slug not found`);
        return null;
      }
      return { fromSkillId: fromId, toSkillId: toId };
    })
    .filter(Boolean) as { fromSkillId: string; toSkillId: string }[];

  await db.insert(skillEdges).values(edgeValues).onConflictDoNothing();
  console.log(`Inserted ${edgeValues.length} skill edges`);
}
