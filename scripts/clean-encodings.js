/**
 * clean-encodings.js
 * Script to clean up corrupt UTF-8 character patterns in HTML files.
 */

const fs = require('fs');
const path = require('path');

const publicFiles = [
  'index.html',
  'about.html',
  'contact.html',
  'donate.html',
  'events.html',
  'work.html',
  'blog.html',
  'blog-post.html'
];

const replacements = [
  { pattern: /Â©/g, replacement: '©' },
  { pattern: /Â·/g, replacement: '·' },
  { pattern: /â€”/g, replacement: '—' },
  { pattern: /â€“/g, replacement: '–' },
  { pattern: /â€¢/g, replacement: '•' }
];

publicFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Cleaned character encodings in ${file}`);
    } else {
      console.log(`ℹ️ No corrupt characters found in ${file}`);
    }
  } else {
    console.log(`⚠️ File not found: ${file}`);
  }
});

console.log('Finished cleaning encodings!');
