import { Worker, type Job } from 'bullmq';
import type { NotificationJobType } from '@careercopliot/types';
import { db, users } from '@careercopliot/db';
import {
  sendEmail,
  buildDailyReminderEmail,
  buildInactivityEmail,
  buildMilestoneEmail,
  buildWeeklyReportEmail,
  buildGroupInviteEmail,
  buildRoleChangedEmail,
  buildVersionSavedEmail,
} from '../senders/email';
import { generateVersionPdf } from '../utils/html-to-pdf';

async function processJob(job: Job<NotificationJobType>) {
  const { userId } = job.data;

  const user = await db.query.users.findFirst({
    where:   (u, { eq }) => eq(u.id, userId),
    columns: { id: true, name: true, email: true },
  });

  if (!user?.email) {
    console.warn(`[notification] User ${userId} not found or has no email — skipping`);
    return;
  }

  const name = user.name ?? 'there';

  let subject: string;
  let htmlBody: string;

  switch (job.data.type) {
    case 'daily_reminder': {
      const t = buildDailyReminderEmail(name, job.data.data.streakDays);
      subject  = t.subject;
      htmlBody = t.html;
      break;
    }
    case 'inactivity_alert': {
      const t = buildInactivityEmail(name, job.data.data.daysSince);
      subject  = t.subject;
      htmlBody = t.html;
      break;
    }
    case 'milestone': {
      const t = buildMilestoneEmail(name, job.data.data.skillName, job.data.data.progressPct);
      subject  = t.subject;
      htmlBody = t.html;
      break;
    }
    case 'weekly_report': {
      const t = buildWeeklyReportEmail(name, job.data.data.tasksCompleted, job.data.data.summary);
      subject  = t.subject;
      htmlBody = t.html;
      break;
    }
    case 'group_joined': {
      const t = buildGroupInviteEmail(name, job.data.data.groupName, job.data.data.inviteCode);
      subject  = t.subject;
      htmlBody = t.html;
      break;
    }
    case 'role_changed': {
      const t = buildRoleChangedEmail(name, job.data.data.groupName, job.data.data.newRole);
      subject  = t.subject;
      htmlBody = t.html;
      break;
    }
    case 'note_version_saved': {
      const { noteTitle, groupName, versionLabel, createdByName, createdAt, htmlContent } = job.data.data;
      const t = buildVersionSavedEmail(name, noteTitle, groupName, versionLabel, createdByName, createdAt);
      subject  = t.subject;
      htmlBody = t.html;

      const safeTitle = noteTitle.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
      const filename  = `${safeTitle}_${new Date(createdAt).toISOString().slice(0, 10)}.pdf`;
      const pdfBuffer = await generateVersionPdf({ noteTitle, groupName, versionLabel, createdByName, createdAt, htmlContent });

      await sendEmail(user.email, subject, htmlBody, [
        { filename, content: pdfBuffer, contentType: 'application/pdf' },
      ]);
      console.log(`[notification] ✓ note_version_saved PDF sent to ${user.email}`);
      return;
    }
    default:
      console.warn(`[notification] Unknown job type: ${(job.data as any).type}`);
      return;
  }

  await sendEmail(user.email, subject, htmlBody);
}

export function startNotificationWorker(redisUrl: string) {
  const worker = new Worker<NotificationJobType>(
    'notifications',
    processJob,
    {
      connection:  { url: redisUrl },
      concurrency: 5,
      limiter:     { max: 100, duration: 60000 },
    }
  );

  worker.on('completed', job => console.log(`[notification] ✓ ${job.data.type} for ${job.data.userId}`));
  worker.on('failed',    (job, err) => console.error(`[notification] ✗ Job ${job?.id} failed:`, err.message));

  return worker;
}
