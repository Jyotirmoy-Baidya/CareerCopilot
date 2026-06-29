import PDFDocument from 'pdfkit';

interface PdfOptions {
  noteTitle:     string;
  groupName:     string;
  versionLabel:  string;
  createdByName: string;
  createdAt:     string;
  htmlContent:   string;
}

// Very lightweight HTML → pdfkit renderer for Tiptap output.
// Handles: h1-h3, p, ul/ol/li, strong/em/code, blockquote, pre, hr.
// Good enough for structured notes; does not handle images or tables.

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')   // <br> → newline before stripping
    .replace(/<[^>]*>/g, '');
}

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'task' | 'pre' | 'blockquote' | 'hr' | 'blank';
  text: string;
  ordered?: boolean;
  index?: number;
  checked?: boolean;
}

function parseBlocks(html: string): Block[] {
  // Collapse real newlines to spaces but preserve <br> for stripTags to handle
  const src = html.replace(/\r?\n/g, ' ').replace(/[ \t]+/g, ' ').trim();
  const blocks: Block[] = [];
  let remaining = src;

  while (remaining.length > 0) {
    // h1
    let m = remaining.match(/^<h1[^>]*>(.*?)<\/h1>(.*)/is);
    if (m) { blocks.push({ type: 'h1', text: stripTags(m[1]).trim() }); remaining = m[2]; continue; }

    // h2
    m = remaining.match(/^<h2[^>]*>(.*?)<\/h2>(.*)/is);
    if (m) { blocks.push({ type: 'h2', text: stripTags(m[1]).trim() }); remaining = m[2]; continue; }

    // h3
    m = remaining.match(/^<h3[^>]*>(.*?)<\/h3>(.*)/is);
    if (m) { blocks.push({ type: 'h3', text: stripTags(m[1]).trim() }); remaining = m[2]; continue; }

    // blockquote
    m = remaining.match(/^<blockquote[^>]*>(.*?)<\/blockquote>(.*)/is);
    if (m) { blocks.push({ type: 'blockquote', text: stripTags(m[1]).trim() }); remaining = m[2]; continue; }

    // pre / code block
    m = remaining.match(/^<pre[^>]*>(.*?)<\/pre>(.*)/is);
    if (m) { blocks.push({ type: 'pre', text: stripTags(m[1]).trim() }); remaining = m[2]; continue; }

    // task list (Tiptap) — must come before generic ul
    m = remaining.match(/^<ul[^>]*data-type="taskList"[^>]*>(.*?)<\/ul>(.*)/is);
    if (m) {
      let items = m[1];
      let im: RegExpMatchArray | null;
      while ((im = items.match(/^[\s\S]*?<li[^>]*data-checked="(true|false)"[^>]*>([\s\S]*?)<\/li>([\s\S]*)/i))) {
        const checked = im[1] === 'true';
        const text    = stripTags(im[2]).trim();
        if (text) blocks.push({ type: 'task', text, checked });
        items = im[3];
      }
      remaining = m[2];
      continue;
    }

    // ol
    m = remaining.match(/^<ol[^>]*>(.*?)<\/ol>(.*)/is);
    if (m) {
      let idx = 1;
      let items = m[1];
      let im: RegExpMatchArray | null;
      while ((im = items.match(/^([\s\S]*?)<li[^>]*>(.*?)<\/li>([\s\S]*)/i))) {
        items = im[3];
        const text = stripTags(im[2]).trim();
        if (text) blocks.push({ type: 'li', text, ordered: true, index: idx++ });
      }
      remaining = m[2];
      continue;
    }

    // ul
    m = remaining.match(/^<ul[^>]*>(.*?)<\/ul>(.*)/is);
    if (m) {
      let items = m[1];
      let im: RegExpMatchArray | null;
      while ((im = items.match(/^([\s\S]*?)<li[^>]*>(.*?)<\/li>([\s\S]*)/i))) {
        items = im[3];
        const text = stripTags(im[2]).trim();
        if (text) blocks.push({ type: 'li', text, ordered: false });
      }
      remaining = m[2];
      continue;
    }

    // hr
    m = remaining.match(/^<hr[^>]*\/?>(.*)/is);
    if (m) { blocks.push({ type: 'hr', text: '' }); remaining = m[1]; continue; }

    // p
    m = remaining.match(/^<p[^>]*>(.*?)<\/p>(.*)/is);
    if (m) {
      const text = stripTags(m[1]).trim();
      blocks.push(text ? { type: 'p', text } : { type: 'blank', text: '' });
      remaining = m[2];
      continue;
    }

    // skip unknown tag
    m = remaining.match(/^<[^>]*>(.*)/is);
    if (m) { remaining = m[1]; continue; }

    // plain text
    m = remaining.match(/^([^<]+)(.*)/is);
    if (m) {
      const text = m[1].trim();
      if (text) blocks.push({ type: 'p', text });
      remaining = m[2];
      continue;
    }

    break;
  }

  return blocks;
}

export function generateVersionPdf(opts: PdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data',  chunk => chunks.push(Buffer.from(chunk)));
    doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
    doc.on('error', err   => reject(err));

    const W        = doc.page.width  - 100; // usable width (50 margin each side)
    const BRAND    = '#059669';
    const GRAY     = '#6b7280';
    const CODE_BG  = '#f3f4f6';

    // ── Cover band ──────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 8).fill(BRAND);
    doc.moveDown(0.3);

    // ── Logo / service name ──────────────────────────────────────────────────
    doc.fontSize(10).fillColor(BRAND).text('CareerCopilot', 50, 20, { continued: true });
    doc.fillColor(GRAY).fontSize(8).text('  ·  Study Notes', { align: 'left' });
    doc.moveDown(0.5);

    // ── Note title ──────────────────────────────────────────────────────────
    doc.fontSize(20).fillColor('#111827').font('Helvetica-Bold').text(opts.noteTitle, 50);
    doc.moveDown(0.25);

    // ── Meta row ────────────────────────────────────────────────────────────
    const meta = `${opts.groupName}  ·  ${opts.versionLabel}  ·  Saved by ${opts.createdByName}  ·  ${new Date(opts.createdAt).toLocaleString()}`;
    doc.fontSize(9).fillColor(GRAY).font('Helvetica').text(meta, 50, undefined, { width: W });

    // Divider
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
    doc.moveDown(0.75);

    // ── Content ──────────────────────────────────────────────────────────────
    if (!opts.htmlContent || opts.htmlContent === '<p></p>') {
      doc.fontSize(11).fillColor(GRAY).font('Helvetica-Oblique').text('(empty note)', 50);
    } else {
      const blocks = parseBlocks(opts.htmlContent);

      for (const block of blocks) {
        if (doc.y > doc.page.height - 100) doc.addPage();

        switch (block.type) {
          case 'h1':
            doc.moveDown(0.5);
            for (const line of block.text.split('\n').filter(Boolean)) {
              doc.fontSize(16).fillColor('#111827').font('Helvetica-Bold').text(line, 50, undefined, { width: W });
            }
            doc.moveDown(0.3);
            break;
          case 'h2':
            doc.moveDown(0.4);
            for (const line of block.text.split('\n').filter(Boolean)) {
              doc.fontSize(13).fillColor('#1f2937').font('Helvetica-Bold').text(line, 50, undefined, { width: W });
            }
            doc.moveDown(0.2);
            break;
          case 'h3':
            doc.moveDown(0.3);
            for (const line of block.text.split('\n').filter(Boolean)) {
              doc.fontSize(11).fillColor('#374151').font('Helvetica-Bold').text(line, 50, undefined, { width: W });
            }
            doc.moveDown(0.2);
            break;
          case 'p':
            for (const line of block.text.split('\n')) {
              if (line.trim()) {
                doc.fontSize(10.5).fillColor('#374151').font('Helvetica').text(line.trim(), 50, undefined, { width: W, lineGap: 2 });
              } else {
                doc.moveDown(0.2);
              }
            }
            doc.moveDown(0.3);
            break;
          case 'li': {
            const bullet = block.ordered ? `${block.index}.` : '•';
            doc.fontSize(10.5).fillColor('#374151').font('Helvetica')
               .text(`${bullet}  ${block.text}`, 60, undefined, { width: W - 10, lineGap: 2 });
            doc.moveDown(0.15);
            break;
          }
          case 'task': {
            const icon = block.checked ? '[x]' : '[ ]';
            doc.fontSize(10.5).fillColor(block.checked ? '#059669' : '#374151').font('Helvetica')
               .text(`${icon}  ${block.text}`, 60, undefined, { width: W - 10, lineGap: 2 });
            doc.moveDown(0.15);
            break;
          }
          case 'blockquote': {
            const qY = doc.y;
            doc.rect(50, qY, 3, 14).fill(BRAND);
            doc.fontSize(10).fillColor(GRAY).font('Helvetica-Oblique')
               .text(block.text, 60, qY, { width: W - 10, lineGap: 2 });
            doc.moveDown(0.3);
            break;
          }
          case 'pre': {
            const preText = block.text;
            const preH    = (preText.split('\n').length + 1) * 13 + 12;
            doc.rect(50, doc.y, W, preH).fill(CODE_BG);
            doc.fontSize(9).fillColor('#1e293b').font('Courier')
               .text(preText, 56, doc.y - preH + 6, { width: W - 12, lineGap: 1 });
            doc.moveDown(0.4);
            break;
          }
          case 'hr':
            doc.moveDown(0.3);
            doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).strokeColor('#d1d5db').lineWidth(0.5).stroke();
            doc.moveDown(0.4);
            break;
          case 'blank':
            doc.moveDown(0.2);
            break;
        }
      }
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 40;
    doc.fontSize(8).fillColor(GRAY).font('Helvetica')
       .text(`Generated by CareerCopilot  ·  ${new Date().toLocaleString()}`, 50, footerY, { width: W, align: 'center' });

    doc.end();
  });
}
