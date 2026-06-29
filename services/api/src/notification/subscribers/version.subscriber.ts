import Redis from 'ioredis';
import { db } from '@careercopliot/db';
import { generateVersionPdf } from '../utils/html-to-pdf';
import { sendEmail, buildVersionSavedEmail } from '../senders/email';

interface VersionSavedEvent {
  versionId:     string;
  noteId:        string;
  noteTitle:     string;
  groupId:       string;
  groupName:     string;
  label:         string;
  htmlContent:   string;
  createdByName: string;
  createdAt:     string;
  ownerUserId:   string;
}

export function startVersionSubscriber(redisUrl: string): Redis {
  const subscriber = new Redis(redisUrl);

  subscriber.subscribe('note:version:saved', err => {
    if (err) console.error('[version-sub] Subscribe error:', err.message);
    else     console.log('[version-sub] Subscribed to note:version:saved');
  });

  subscriber.on('message', async (_channel: string, message: string) => {
    let event: VersionSavedEvent;
    try {
      event = JSON.parse(message) as VersionSavedEvent;
    } catch {
      console.error('[version-sub] Bad message JSON');
      return;
    }

    try {
      const owner = await db.query.users.findFirst({
        where:   (u, { eq }) => eq(u.id, event.ownerUserId),
        columns: { id: true, name: true, email: true },
      });

      if (!owner?.email) {
        console.warn(`[version-sub] Owner ${event.ownerUserId} has no email — skipping`);
        return;
      }

      const [emailTpl, pdfBuffer] = await Promise.all([
        Promise.resolve(buildVersionSavedEmail(
          owner.name ?? 'there',
          event.noteTitle,
          event.groupName,
          event.label,
          event.createdByName,
          event.createdAt,
        )),
        generateVersionPdf({
          noteTitle:     event.noteTitle,
          groupName:     event.groupName,
          versionLabel:  event.label,
          createdByName: event.createdByName,
          createdAt:     event.createdAt,
          htmlContent:   event.htmlContent,
        }),
      ]);

      const safeTitle = event.noteTitle.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
      const filename  = `${safeTitle}_${new Date(event.createdAt).toISOString().slice(0, 10)}.pdf`;

      await sendEmail(owner.email, emailTpl.subject, emailTpl.html, [
        { filename, content: pdfBuffer, contentType: 'application/pdf' },
      ]);

      console.log(`[version-sub] Emailed version PDF "${filename}" to ${owner.email}`);
    } catch (err) {
      console.error('[version-sub] Handler error:', (err as Error).message);
    }
  });

  subscriber.on('error', err => console.error('[version-sub] Redis error:', err.message));

  return subscriber;
}
