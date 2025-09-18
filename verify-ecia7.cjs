const fs = require('fs');
const path = require('path');

console.log('=== ECIA-7 Integration Verification ===');

// Read the file content
const filePath = path.join(__dirname, 'src', 'lib', 'superiorPromptIntelligence.js');
const content = fs.readFileSync(filePath, 'utf8');

console.log('File read successfully ✓');

// Extract the ECIA7_SYSTEM_PROMPT
const promptMatch = content.match(/this\.ECIA7_SYSTEM_PROMPT = \`([\s\S]*?)\`;/);
if (promptMatch) {
  const prompt = promptMatch[1];
  console.log('\n=== Character Limit Analysis ===');
  console.log('ECIA-7 Prompt Length:', prompt.length);
  console.log('Within 30K limit:', prompt.length <= 30000);
  console.log('Character limit buffer:', 30000 - prompt.length);

  console.log('\n=== Content Integrity Check ===');
  console.log('Starts with "Institute for Critical Infrastructure":', prompt.startsWith('Institute for Critical Infrastructure'));
  console.log('Contains "Elite Cybersecurity Intelligence Agent":', prompt.includes('Elite Cybersecurity Intelligence Agent'));
  console.log('Contains "END SYSTEM PROMPT":', prompt.includes('END SYSTEM PROMPT'));

  console.log('\n=== Key Sections Verification ===');
  const keySections = [
    'SYSTEM ROLE',
    'PRIME DIRECTIVE',
    'CORE OBJECTIVES',
    'HARD CONSTRAINTS',
    'REFERENCE FRAMEWORKS'
  ];

  keySections.forEach(section => {
    const present = prompt.includes(section);
    console.log(`${section}: ${present ? '✓' : '✗'}`);
  });

} else {
  console.log('❌ ECIA7_SYSTEM_PROMPT not found in file');
}

console.log('\n=== Verification Complete ===');