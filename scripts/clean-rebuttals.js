/**
 * One-time script to clean HTML from Rebuttal records in the database.
 * Strips HTML tags and decodes HTML entities from Title and Content fields.
 *
 * Usage: node scripts/clean-rebuttals.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(html) {
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|h[1-6]|li|tr|ul|ol)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  text = decodeEntities(text);
  text = text.replace(/\n{2,}/g, '\n').trim();
  return text;
}

async function main() {
  const rebuttals = await prisma.rebuttal.findMany();
  console.log(`Found ${rebuttals.length} rebuttals\n`);

  let updated = 0;

  for (const r of rebuttals) {
    const cleanTitle = decodeEntities(r.title);
    const cleanContent = stripHtml(r.content);

    const titleChanged = cleanTitle !== r.title;
    const contentChanged = cleanContent !== r.content;

    if (titleChanged || contentChanged) {
      await prisma.rebuttal.update({
        where: { idRebuttal: r.idRebuttal },
        data: {
          title: cleanTitle,
          content: cleanContent,
          modifiedDate: new Date(),
        },
      });
      updated++;
      console.log(`#${r.idRebuttal} "${cleanTitle.substring(0, 50)}" — ${titleChanged ? 'title' : ''}${titleChanged && contentChanged ? ' + ' : ''}${contentChanged ? 'content' : ''} cleaned`);
    }
  }

  console.log(`\nDone. ${updated}/${rebuttals.length} rebuttals updated.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
