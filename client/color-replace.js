const fs = require('fs');
const path = require('path');

const dir = '/home/huzafia/Desktop/alumni portal/client/src';

const mappings = [
  // Backgrounds
  { regex: /bg-slate-50/g, replacement: 'bg-light-section' },
  { regex: /bg-slate-100/g, replacement: 'bg-secondary' },
  { regex: /bg-slate-200/g, replacement: 'bg-secondary' },
  { regex: /bg-slate-800/g, replacement: 'bg-primary' },
  { regex: /bg-slate-900/g, replacement: 'bg-primary' },
  { regex: /bg-\[#[a-zA-Z0-9]+\]/g, replacement: 'bg-primary' },
  { regex: /bg-blue-[0-9]+/g, replacement: 'bg-primary' },
  { regex: /bg-green-[0-9]+/g, replacement: 'bg-secondary' },
  { regex: /bg-red-[0-9]+/g, replacement: 'bg-accent' },
  
  // Texts
  { regex: /text-slate-[4-9]00/g, replacement: 'text-primary' },
  { regex: /text-slate-[1-3]00/g, replacement: 'text-secondary' },
  { regex: /text-blue-[0-9]+/g, replacement: 'text-primary' },
  { regex: /text-green-[0-9]+/g, replacement: 'text-primary' },
  { regex: /text-red-[0-9]+/g, replacement: 'text-accent' },

  // Borders
  { regex: /border-slate-[0-9]+/g, replacement: 'border-secondary' },
  { regex: /border-blue-[0-9]+/g, replacement: 'border-primary' },

  // Rings
  { regex: /ring-slate-[0-9]+/g, replacement: 'ring-secondary' },
  { regex: /ring-blue-[0-9]+/g, replacement: 'ring-primary' },

  // Shadows
  { regex: /shadow-blue-900/g, replacement: 'shadow-primary' },

  // Hovers
  { regex: /hover:bg-slate-[0-9]+/g, replacement: 'hover:bg-secondary' },
  { regex: /hover:bg-\[#[a-zA-Z0-9]+\]/g, replacement: 'hover:bg-accent' },
  { regex: /hover:text-\[#[a-zA-Z0-9]+\]/g, replacement: 'hover:text-primary' },
  { regex: /hover:ring-\[#[a-zA-Z0-9]+\]/g, replacement: 'hover:ring-primary' },
];

function processDir(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Also map white to background directly where relevant
      // We don't necessarily replace bg-white, because we can define background as white
      
      for (const { regex, replacement } of mappings) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Modified', fullPath);
      }
    }
  }
}

processDir(dir);
