import nodemailer from 'nodemailer';

// Read credentials lazily at send-time so env vars loaded after module init are picked up.
function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

// ── HTML shell ──────────────────────────────────────────────────────────────

function html(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#0ea5e9);padding:28px 36px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                CareerCopilot
              </h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:13px;">Your AI-powered career learning platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #f0f0f0;background:#fafafa;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                You received this because you have an account on CareerCopilot.<br />
                © ${new Date().getFullYear()} CareerCopilot — All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(text: string, href: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${text}</a>`;
}

// ── Templates ───────────────────────────────────────────────────────────────

export function buildDailyReminderEmail(name: string, streakDays: number) {
  const title = `Day ${streakDays} streak — keep it going!`;
  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Good morning, ${name}! ☀️</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">
      You're on a <strong style="color:#059669;">${streakDays}-day streak</strong>.
      Even 30 minutes today keeps the momentum going.
    </p>
    <div style="margin:24px 0;padding:16px;background:#ecfdf5;border-radius:8px;border-left:4px solid #059669;">
      <p style="margin:0;color:#065f46;font-size:14px;font-weight:600;">🔥 ${streakDays} days and counting</p>
      <p style="margin:4px 0 0;color:#047857;font-size:13px;">Your roadmap is waiting — let's keep building.</p>
    </div>
    ${btn('Continue learning →', 'http://localhost:3000/home')}`;
  return { subject: `🔥 Day ${streakDays} — keep your streak alive!`, html: html(title, body) };
}

export function buildInactivityEmail(name: string, daysSince: number) {
  const title = `We miss you, ${name}`;
  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Hey ${name}, it's been a while 👋</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">
      You haven't logged in for <strong>${daysSince} day${daysSince !== 1 ? 's' : ''}</strong>.
      Your roadmap is still right where you left it — no need to start over.
    </p>
    <div style="margin:24px 0;padding:16px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b;">
      <p style="margin:0;color:#92400e;font-size:14px;">Just 15 minutes today puts you back on track.</p>
    </div>
    ${btn('Pick up where you left off →', 'http://localhost:3000/home')}`;
  return { subject: `We miss you, ${name} — your roadmap is waiting`, html: html(title, body) };
}

export function buildMilestoneEmail(name: string, skillName: string, progressPct: number) {
  const title = `Milestone: ${skillName} complete!`;
  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">🎉 Milestone unlocked, ${name}!</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">
      You just completed <strong>"${skillName}"</strong> — that's
      <strong style="color:#059669;">${progressPct}%</strong> of your roadmap done!
    </p>
    <div style="margin:24px 0;">
      <div style="background:#e5e7eb;border-radius:99px;height:12px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,#059669,#0ea5e9);height:100%;width:${progressPct}%;border-radius:99px;"></div>
      </div>
      <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">${progressPct}% complete</p>
    </div>
    ${btn('See your progress →', 'http://localhost:3000/progress')}`;
  return { subject: `🎉 You completed "${skillName}" — ${progressPct}% done!`, html: html(title, body) };
}

export function buildWeeklyReportEmail(name: string, tasksCompleted: number, summary: string) {
  const title = `Your weekly report`;
  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Weekly recap for ${name} 📊</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">${summary}</p>
    <div style="margin:24px 0;padding:20px;background:#f0fdf4;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:36px;font-weight:700;color:#059669;">${tasksCompleted}</p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">tasks completed this week</p>
    </div>
    ${btn('View your roadmap →', 'http://localhost:3000/roadmap')}`;
  return { subject: `📊 Your weekly report — ${tasksCompleted} tasks done`, html: html(title, body) };
}

export function buildGroupInviteEmail(name: string, groupName: string, inviteCode: string) {
  const title = `You joined ${groupName}`;
  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">You're in, ${name}! 🎓</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">
      You've joined the study group <strong>"${groupName}"</strong>.
      Start collaborating on shared notes and track your progress together.
    </p>
    <div style="margin:24px 0;padding:16px;background:#eff6ff;border-radius:8px;border-left:4px solid #3b82f6;">
      <p style="margin:0;color:#1e40af;font-size:13px;font-weight:600;">Invite code</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:700;letter-spacing:4px;color:#1d4ed8;">${inviteCode}</p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">Share this with others to invite them</p>
    </div>
    ${btn('Open study group →', 'http://localhost:3000/groups')}`;
  return { subject: `You joined "${groupName}" on CareerCopilot`, html: html(title, body) };
}

export function buildRoleChangedEmail(name: string, groupName: string, newRole: string) {
  const roleLabel: Record<string, string> = { admin: 'Admin', editor: 'Editor', viewer: 'Member' };
  const title = `Your role changed in ${groupName}`;
  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Role updated, ${name}</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">
      Your role in <strong>"${groupName}"</strong> has been updated to
      <strong style="color:#059669;">${roleLabel[newRole] ?? newRole}</strong>.
    </p>
    ${btn('View group →', 'http://localhost:3000/groups')}`;
  return { subject: `Your role in "${groupName}" has changed`, html: html(title, body) };
}

export function buildVersionSavedEmail(
  ownerName: string,
  noteTitle: string,
  groupName: string,
  versionLabel: string,
  createdByName: string,
  createdAt: string,
) {
  const date = new Date(createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const title = `New version saved — ${noteTitle}`;
  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">New note version saved</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;">
      Hi ${ownerName}, a new version of a note in your study group has been saved.
    </p>
    <div style="margin:24px 0;padding:20px;background:#f0fdf4;border-radius:8px;border-left:4px solid #059669;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr><td style="color:#6b7280;font-size:12px;padding-bottom:2px;">NOTE</td></tr>
        <tr><td style="color:#111827;font-size:15px;font-weight:600;padding-bottom:10px;">${noteTitle}</td></tr>
        <tr><td style="color:#6b7280;font-size:12px;padding-bottom:2px;">GROUP</td></tr>
        <tr><td style="color:#111827;font-size:14px;padding-bottom:10px;">${groupName}</td></tr>
        <tr><td style="color:#6b7280;font-size:12px;padding-bottom:2px;">VERSION</td></tr>
        <tr><td style="color:#111827;font-size:14px;padding-bottom:10px;">${versionLabel}</td></tr>
        <tr><td style="color:#6b7280;font-size:12px;padding-bottom:2px;">SAVED BY</td></tr>
        <tr><td style="color:#111827;font-size:14px;padding-bottom:10px;">${createdByName}</td></tr>
        <tr><td style="color:#6b7280;font-size:12px;padding-bottom:2px;">TIME</td></tr>
        <tr><td style="color:#111827;font-size:14px;">${date}</td></tr>
      </table>
    </div>
    <p style="color:#6b7280;font-size:13px;">The full note content is attached as a PDF.</p>
    ${btn('Open note →', 'http://localhost:3000/groups')}`;
  return { subject: `📄 New version saved: "${noteTitle}"`, html: html(title, body) };
}

// ── Send helper ─────────────────────────────────────────────────────────────

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  attachments: EmailAttachment[] = [],
): Promise<void> {
  const transport = getTransport();
  const gmailUser = process.env.GMAIL_USER!;

  if (!transport) {
    console.log(`[email mock] To: ${to} | Subject: ${subject} | Attachments: ${attachments.length}`);
    return;
  }

  await transport.sendMail({
    from: `"CareerCopilot" <${gmailUser}>`,
    to,
    subject,
    html: htmlBody,
    attachments: attachments.map(a => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });

  console.log(`[email] Sent "${subject}" to ${to}`);
}
