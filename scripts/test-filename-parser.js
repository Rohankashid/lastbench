#!/usr/bin/env node

// Test script to demonstrate filename parsing
function parseMetadataFromFilename(filename, category) {
  const path = require('path');
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  const parts = nameWithoutExt.split(/[-_]/);
  
  // Default values
  let metadata = {
    name: nameWithoutExt.replace(/[-_]/g, ' ').trim(),
    branch: '',
    subject: '',
    university: '',
    semester: '',
    year: category === 'pyq' ? new Date().getFullYear().toString() : null,
    category: category
  };
  
  // Try to parse structured filenames
  if (parts.length >= 4) {
    // Pattern: Branch_Subject_University_Semester_[Year]_[Type]
    // Example: CSE_Data_Structures_Mumbai_Uni_Sem3_Notes
    // Example: IT_Computer_Networks_Mumbai_Uni_Sem5_2023_PYQ
    
    let currentIndex = 0;
    
    // Branch (first part)
    if (parts[currentIndex]) {
      metadata.branch = parts[currentIndex];
      currentIndex++;
    }
    
    // First, find the university pattern to know where to stop subject parsing
    let universityStartIndex = -1;
    for (let i = 0; i < parts.length - 1; i++) {
      if (parts[i].toLowerCase() === 'mumbai' && 
          parts[i + 1].toLowerCase().includes('uni')) {
        universityStartIndex = i;
        break;
      }
    }
    
    // Subject (next parts until we find university indicators)
    const subjectParts = [];
    while (currentIndex < parts.length && 
           !parts[currentIndex].toLowerCase().includes('uni') &&
           !parts[currentIndex].toLowerCase().includes('sem') &&
           !parts[currentIndex].toLowerCase().includes('pyq') &&
           !parts[currentIndex].toLowerCase().includes('note') &&
           !/^\d{4}$/.test(parts[currentIndex])) {
      
      // Stop if we reach the university part
      if (universityStartIndex !== -1 && currentIndex >= universityStartIndex) {
        break;
      }
      
      subjectParts.push(parts[currentIndex]);
      currentIndex++;
    }
    if (subjectParts.length > 0) {
      metadata.subject = subjectParts.join(' ');
    }
    
    // University parsing
    if (universityStartIndex !== -1) {
      // We found the university pattern, set it
      metadata.university = 'Mumbai University';
      currentIndex = universityStartIndex + 2; // Move past Mumbai and Uni
    } else {
      // Fallback: look for 'uni' anywhere
      while (currentIndex < parts.length && 
             !parts[currentIndex].toLowerCase().includes('sem') &&
             !parts[currentIndex].toLowerCase().includes('pyq') &&
             !parts[currentIndex].toLowerCase().includes('note') &&
             !/^\d{4}$/.test(parts[currentIndex])) {
        if (parts[currentIndex].toLowerCase().includes('uni')) {
          // Get the full university name (current part + next part if it's not a semester/year)
          let uniName = parts[currentIndex];
          if (currentIndex + 1 < parts.length && 
              !parts[currentIndex + 1].toLowerCase().includes('sem') &&
              !parts[currentIndex + 1].toLowerCase().includes('pyq') &&
              !parts[currentIndex + 1].toLowerCase().includes('note') &&
              !/^\d{4}$/.test(parts[currentIndex + 1])) {
            uniName += ' ' + parts[currentIndex + 1];
            currentIndex++;
          }
          // Replace 'Uni' with 'University' but keep the rest of the name
          metadata.university = uniName.replace(/uni/i, 'University');
          currentIndex++;
          break;
        }
        currentIndex++;
      }
    }
    
    // Clean up subject by removing university name if it was included
    if (metadata.subject && metadata.university) {
      const uniWords = metadata.university.split(' ');
      const subjectWords = metadata.subject.split(' ');
      const cleanSubjectWords = subjectWords.filter(word => 
        !uniWords.some(uniWord => 
          uniWord.toLowerCase() !== 'university' && 
          word.toLowerCase() === uniWord.toLowerCase()
        )
      );
      metadata.subject = cleanSubjectWords.join(' ');
    }
    
    // Semester (look for 'sem' followed by number)
    while (currentIndex < parts.length) {
      if (parts[currentIndex].toLowerCase().includes('sem')) {
        const semMatch = parts[currentIndex].match(/sem(\d+)/i);
        if (semMatch) {
          metadata.semester = semMatch[1];
        }
        currentIndex++;
        break;
      }
      currentIndex++;
    }
    
    // Year (for PYQs, look for 4-digit year)
    if (category === 'pyq') {
      while (currentIndex < parts.length) {
        if (/^\d{4}$/.test(parts[currentIndex])) {
          metadata.year = parts[currentIndex];
          break;
        }
        currentIndex++;
      }
    }
    
    // Material name (combine branch and subject)
    if (metadata.branch && metadata.subject) {
      metadata.name = `${metadata.branch} - ${metadata.subject}`;
    } else if (metadata.subject) {
      metadata.name = metadata.subject;
    }
  }
  
  // Fallback: if we couldn't parse much, use the filename as name
  if (!metadata.name || metadata.name === nameWithoutExt) {
    metadata.name = nameWithoutExt.replace(/[-_]/g, ' ').trim();
  }
  
  return metadata;
}

// Test cases
const testFiles = [
  // Notes examples
  'CSE_Data_Structures_Mumbai_Uni_Sem3_Notes.pdf',
  'IT_Computer_Networks_Mumbai_Uni_Sem5_Notes.pdf',
  'Mechanical_Thermodynamics_Mumbai_Uni_Sem4_Notes.pdf',
  
  // PYQ examples
  'CSE_Data_Structures_Mumbai_Uni_Sem3_2023_PYQ.pdf',
  'IT_Computer_Networks_Mumbai_Uni_Sem5_2022_PYQ.pdf',
  'Mechanical_Thermodynamics_Mumbai_Uni_Sem4_2021_PYQ.pdf',
  
  // Simple examples
  'Data_Structures_Notes.pdf',
  'Computer_Networks_2023_PYQ.pdf',
  
  // Complex examples
  'CSE_Advanced_Data_Structures_and_Algorithms_Mumbai_Uni_Sem6_2023_PYQ.pdf',
  'IT_Computer_Networks_and_Communication_Mumbai_Uni_Sem5_Notes.pdf'
];

console.log('🧪 Testing Filename Parser\n');
console.log('=' .repeat(80));

testFiles.forEach(filename => {
  const category = filename.toLowerCase().includes('pyq') ? 'pyq' : 'notes';
  const metadata = parseMetadataFromFilename(filename, category);
  
  console.log(`📁 Filename: ${filename}`);
  console.log(`📋 Category: ${category.toUpperCase()}`);
  console.log(`🔍 Parsed Metadata:`);
  console.log(`   • Name: ${metadata.name}`);
  console.log(`   • Branch: ${metadata.branch || 'N/A'}`);
  console.log(`   • Subject: ${metadata.subject || 'N/A'}`);
  console.log(`   • University: ${metadata.university || 'N/A'}`);
  console.log(`   • Semester: ${metadata.semester || 'N/A'}`);
  console.log(`   • Year: ${metadata.year || 'N/A'}`);
  console.log('─'.repeat(80));
});

console.log('\n📝 Filename Format Guidelines:');
console.log('For best results, use this format:');
console.log('   Branch_Subject_University_Semester_[Year]_[Type]');
console.log('');
console.log('Examples:');
console.log('   • CSE_Data_Structures_Mumbai_Uni_Sem3_Notes.pdf');
console.log('   • IT_Computer_Networks_Mumbai_Uni_Sem5_2023_PYQ.pdf');
console.log('   • Mechanical_Thermodynamics_Mumbai_Uni_Sem4_2022_PYQ.pdf');
console.log('');
console.log('Key points:');
console.log('   • Use underscores (_) to separate parts');
console.log('   • Include "Uni" for university detection');
console.log('   • Include "Sem" + number for semester');
console.log('   • Include 4-digit year for PYQs');
console.log('   • End with "Notes" or "PYQ" to indicate type'); 