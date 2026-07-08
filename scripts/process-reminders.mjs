import { processDueReminders } from '../src/lib/reminders';

const processed = await processDueReminders();
console.log(`Processed ${processed.length} reminder(s).`);
