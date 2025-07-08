# Auto-Upload Script for LastBench

This script automatically uploads files from two separate folders on your Mac to your LastBench application - one for study notes and one for previous year questions.

## Features

- ✅ **Dual folder support** - Separate folders for notes and PYQs
- ✅ **Automatic type detection** - Detects material type based on folder
- ✅ **Automatically uploads files** from monitored folders
- ✅ **Supports all file types** (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, Images)
- ✅ **File validation** (size, type, extension)
- ✅ **Comprehensive logging**
- ✅ **Configurable metadata**
- ✅ **Cron job integration** for daily execution

## Quick Setup

1. **Run the setup script:**
   ```bash
   cd scripts
   chmod +x setup-cron.sh
   ./setup-cron.sh
   ```

2. **Update configuration:**
   Edit `auto-upload.js` and update the `CONFIG` object with your settings.

3. **Test the script:**
   ```bash
   cd scripts
   node auto-upload.js
   ```

## Folder Structure

The script creates and monitors two folders:

```
/Users/rohan/Desktop/
├── auto-upload-notes/     # Drop study notes here
│   └── uploaded/         # Processed notes (optional)
└── auto-upload-pyqs/     # Drop previous year questions here
    └── uploaded/         # Processed PYQs (optional)
```

## Configuration

Edit the `CONFIG` object in `auto-upload.js`:

```javascript
const CONFIG = {
  // Local folders to monitor
  folders: {
    notes: '/Users/rohan/Desktop/auto-upload-notes', // Folder for study notes
    pyqs: '/Users/rohan/Desktop/auto-upload-pyqs'    // Folder for previous year questions
  },
  
  // Application settings
  baseUrl: 'http://localhost:3000', // Change to your app URL
  uploadEndpoint: '/api/upload',
  
  // Material metadata
  defaultMetadata: {
    university: 'Your University',
    semester: '1',
    subject: 'Auto Upload',
    branch: 'Computer Engineering / Computer Science and Engineering (CSE)',
    year: new Date().getFullYear().toString()
  },
  
  // Authentication (if needed)
  authToken: '', // Set if you implement token auth
};
```

## How It Works

1. **📁 Dual Folder Monitoring**: 
   - Monitors `/Users/rohan/Desktop/auto-upload-notes` for study notes
   - Monitors `/Users/rohan/Desktop/auto-upload-pyqs` for previous year questions

2. **🔍 Automatic Type Detection**: 
   - Files in `auto-upload-notes` → uploaded as `category: 'note'`
   - Files in `auto-upload-pyqs` → uploaded as `category: 'pyq'`

3. **📤 Upload Process**: 
   - Validates files (type, size, extension)
   - Uploads each valid file with appropriate metadata
   - PYQs automatically get the current year

4. **📝 Logging**: Records all activities in `auto-upload.log`

5. **⏰ Cron Job**: Runs daily at 9:00 AM

## Usage

### For Study Notes:
1. **Drop files** into `/Users/rohan/Desktop/auto-upload-notes`
2. **Files will be uploaded** as study notes with `category: 'note'`

### For Previous Year Questions:
1. **Drop files** into `/Users/rohan/Desktop/auto-upload-pyqs`
2. **Files will be uploaded** as PYQs with `category: 'pyq'` and current year

## File Naming

The script automatically generates material names from filenames:
- `CS101_Lecture_Notes.pdf` → "CS101 Lecture Notes"
- `Data_Structures_Assignment.docx` → "Data Structures Assignment"

## Cron Job Schedule

The default cron job runs daily at 9:00 AM. To change the schedule:

```bash
# Edit cron jobs
crontab -e

# Examples:
# Run every hour: 0 * * * * cd /path/to/scripts && node auto-upload.js
# Run every 6 hours: 0 */6 * * * cd /path/to/scripts && node auto-upload.js
# Run at 2 AM: 0 2 * * * cd /path/to/scripts && node auto-upload.js
```

## Manual Execution

```bash
cd scripts
node auto-upload.js
```

## Logs

- **Script logs**: `auto-upload.log`
- **Cron logs**: `cron.log`

Example log output:
```
[2024-01-15T09:00:00.000Z] 🚀 Starting auto-upload process for all folders...
[2024-01-15T09:00:00.001Z] 📚 Processing Notes folder...
[2024-01-15T09:00:00.002Z] Found 2 valid files in note folder
[2024-01-15T09:00:00.003Z] Uploading NOTE: CS101_Lecture_Notes.pdf
[2024-01-15T09:00:00.004Z] ✅ Successfully uploaded NOTE: CS101_Lecture_Notes.pdf
[2024-01-15T09:00:00.005Z] 📝 Processing PYQs folder...
[2024-01-15T09:00:00.006Z] Found 1 valid files in pyq folder
[2024-01-15T09:00:00.007Z] Uploading PYQ: Data_Structures_2023.pdf
[2024-01-15T09:00:00.008Z] ✅ Successfully uploaded PYQ: Data_Structures_2023.pdf
[2024-01-15T09:00:00.009Z] 📊 Upload Summary:
[2024-01-15T09:00:00.010Z]    Notes: 1/1 uploaded
[2024-01-15T09:00:00.011Z]    PYQs: 1/1 uploaded
[2024-01-15T09:00:00.012Z]    Total: 2/2 files uploaded successfully
```

## Troubleshooting

### Common Issues

1. **Permission denied**: Make sure the script is executable
   ```bash
   chmod +x auto-upload.js
   ```

2. **Folders not found**: Create the folders manually
   ```bash
   mkdir -p /Users/rohan/Desktop/auto-upload-notes
   mkdir -p /Users/rohan/Desktop/auto-upload-pyqs
   ```

3. **Upload fails**: Check your app URL and authentication settings

4. **Cron not working**: Check cron logs
   ```bash
   tail -f scripts/cron.log
   ```

### Debug Mode

Add debug logging by modifying the script:
```javascript
// Add this at the top of the script
process.env.DEBUG = 'true';
```

## Security Considerations

1. **Authentication**: Implement proper authentication for your upload endpoint
2. **File Validation**: The script validates files, but ensure your API also validates
3. **Network Security**: Use HTTPS in production
4. **File Permissions**: Ensure the script has read access to both folders

## Customization

### Different File Types

Add more file types to `allowedExtensions`:
```javascript
allowedExtensions: ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.zip', '.rar']
```

### Custom Metadata

Modify the `defaultMetadata` object to set different default values for your materials.

### File Processing

Uncomment these lines in the script to move/delete files after upload:
```javascript
// fs.unlinkSync(filePath); // Delete after upload
// fs.renameSync(filePath, path.join(folderPath, 'uploaded', file)); // Move to uploaded folder
```

### Custom Folder Paths

Change the folder paths in the `CONFIG.folders` object:
```javascript
folders: {
  notes: '/path/to/your/notes/folder',
  pyqs: '/path/to/your/pyqs/folder'
}
```

## Support

If you encounter issues:
1. Check the log files
2. Verify your configuration
3. Test manually first
4. Ensure your application is running and accessible 