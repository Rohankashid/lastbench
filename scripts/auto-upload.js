#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  // Local folders to monitor
  folders: {
    note: '/Users/rohan/Documents/notes', // Folder for study notes
    pyqs: '/Users/rohan/Documents/pyqs'    // Folder for previous year questions
  },
  
  baseUrl: 'https://lastbench.vercel.app/', 
  uploadEndpoint: '/api/upload',
  
  // File settings
  allowedExtensions: ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp'],
  maxFileSize: 100 * 1024 * 1024, 
  
  
  // Material metadata (fallback values if filename parsing fails)
  defaultMetadata: {
    name: '', // Will be set from filename
    university: '', // Will be parsed from filename
    semester: '', // Will be parsed from filename
    subject: '', // Will be parsed from filename
    branch: '', // Will be parsed from filename
    year: new Date().getFullYear().toString() // Default to current year for PYQs
  },
  
  // Authentication (you'll need to get a valid token)
  authToken: '', // You'll need to set this
  
  // Logging
  logFile: path.join(__dirname, 'auto-upload.log')
};

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Also write to log file
  fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
}

// Get file extension
function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

// Check if file is allowed
function isFileAllowed(filename) {
  const ext = getFileExtension(filename);
  // Only allow files that match the extension (pattern restriction removed)
  return CONFIG.allowedExtensions.includes(ext);
}

// Check file size
function isFileSizeValid(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size <= CONFIG.maxFileSize;
}

// Compute SHA256 hash of a file
function computeFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Best-practice robust filename parser
function parseMetadataFromFilename(filename, category) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  const parts = nameWithoutExt.split('_');

  // Debug: print the parts array
  console.log('DEBUG parts:', parts);

  let metadata = {
    name: '',
    branch: '',
    subject: '',
    university: '',
    semester: '',
    year: category === 'pyq' ? new Date().getFullYear().toString() : null,
    category: category
  };

  // Minimal robust parser for your format
  if (category === 'note' && parts.length >= 6) {
    metadata.branch = parts[0];
    metadata.subject = parts[1];
    metadata.university = parts[2] + '_' + parts[3];
    metadata.semester = parts[4].replace(/sem/i, '');
    metadata.name = parts.slice(5).join(' ');
  } else if (category === 'pyq' && parts.length >= 7) {
    metadata.branch = parts[0];
    metadata.subject = parts[1];
    metadata.university = parts[2] + '_' + parts[3];
    metadata.semester = parts[4].replace(/sem/i, '');
    metadata.year = parts[5];
    metadata.name = parts.slice(6).join(' ');
  } else {
    metadata.name = nameWithoutExt.replace(/[-_]/g, ' ').trim();
  }

  // Clean up whitespace
  Object.keys(metadata).forEach(k => {
    if (typeof metadata[k] === 'string') {
      metadata[k] = metadata[k].replace(/\s+/g, ' ').trim();
    }
  });

  // Debug: print the metadata object
  console.log('DEBUG metadata:', metadata);

  return metadata;
}

// Upload file to the application
async function uploadFile(filePath, category) {
  try {
    const filename = path.basename(filePath);
    
    // Parse metadata from filename
    const parsedMetadata = parseMetadataFromFilename(filename, category);
    
    // Compute file hash
    const fileHash = computeFileHash(filePath);
    log(`Uploading ${category.toUpperCase()}: ${filename}`);
    log(`📋 Parsed metadata: ${JSON.stringify(parsedMetadata, null, 2)}`);
    log(`🔑 File hash: ${fileHash}`);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    // Add parsed metadata to form data, with fallbacks
    const finalMetadata = { ...CONFIG.defaultMetadata, ...parsedMetadata, fileHash };
    Object.keys(finalMetadata).forEach(key => {
      if (finalMetadata[key] !== '' && finalMetadata[key] !== null) {
        formData.append(key, finalMetadata[key]);
      }
    });
    
    // Make upload request
    const response = await axios.post(`${CONFIG.baseUrl}${CONFIG.uploadEndpoint}`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${CONFIG.authToken}` // If you implement token auth
      },
      timeout: 300000 // 5 minutes timeout
    });
    
    if (response.status === 200) {
      log(`✅ Successfully uploaded ${category.toUpperCase()}: ${filename}`);
      return true;
    } else {
      log(`❌ Failed to upload ${category.toUpperCase()}: ${filename} - Status: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    log(`❌ Error uploading ${path.basename(filePath)} (${category}): ${error.message}`);
    return false;
  }
}

// Process files in a specific folder
async function processFolder(folderPath, category) {
  try {
    log(`Processing ${category} folder: ${folderPath}`);
    
    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      log(`📁 Creating ${category} folder: ${folderPath}`);
      fs.mkdirSync(folderPath, { recursive: true });
      return;
    }
    
    // Read all files in the folder
    const files = fs.readdirSync(folderPath);
    const validFiles = files.filter(file => {
      const filePath = path.join(folderPath, file);
      return fs.statSync(filePath).isFile() && 
             isFileAllowed(file) && 
             isFileSizeValid(filePath);
    });
    
    if (validFiles.length === 0) {
      log(`No valid files found in ${category} folder`);
      return { processed: 0, success: 0 };
    }
    
    log(`Found ${validFiles.length} valid files in ${category} folder`);
    
    // Upload each file
    let successCount = 0;
    for (const file of validFiles) {
      const filePath = path.join(folderPath, file);
      const success = await uploadFile(filePath, category);
      
      if (success) {
        successCount++;
        // Optionally move or delete the file after successful upload
        // fs.unlinkSync(filePath); // Delete after upload
        // fs.renameSync(filePath, path.join(folderPath, 'uploaded', file)); // Uncomment to move to uploaded folder
      }
    }
    
    log(`${category.toUpperCase()} upload completed. ${successCount}/${validFiles.length} files uploaded successfully`);
    return { processed: validFiles.length, success: successCount };
    
  } catch (error) {
    log(`❌ Error processing ${category} folder: ${error.message}`);
    return { processed: 0, success: 0 };
  }
}

// Process all folders
async function processAllFolders() {
  try {
    log('🚀 Starting auto-upload process for all folders...');
    
    const results = {};
    
    // Process notes folder
    log('📚 Processing Notes folder...');
    results.note = await processFolder(CONFIG.folders.note, 'note');
    
    // Process PYQs folder
    log('📝 Processing PYQs folder...');
    results.pyqs = await processFolder(CONFIG.folders.pyqs, 'pyq');
    
    // Summary
    const totalProcessed = results.note.processed + results.pyqs.processed;
    const totalSuccess = results.note.success + results.pyqs.success;
    
    log('📊 Upload Summary:');
    log(`   Note: ${results.note.success}/${results.note.processed} uploaded`);
    log(`   PYQs: ${results.pyqs.success}/${results.pyqs.processed} uploaded`);
    log(`   Total: ${totalSuccess}/${totalProcessed} files uploaded successfully`);
    
    return results;
    
  } catch (error) {
    log(`❌ Error in processAllFolders: ${error.message}`);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  processAllFolders().then(results => {
    log('✅ Auto-upload process finished.');
    process.exit(0);
  }).catch(error => {
    log(`❌ Auto-upload process failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { processAllFolders, processFolder, CONFIG }; 