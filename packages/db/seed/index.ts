import 'dotenv/config';
import { seedSkills } from './skills';

async function main() {
  console.log('Running database seed...');
  await seedSkills();
  console.log('Seed complete.');
  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
