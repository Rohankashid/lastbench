# File Validation Implementation

This document describes the comprehensive file validation system implemented for the LastBench application.

## Overview

File validation has been implemented to prevent malicious file uploads, oversized files, and inappropriate content. The system includes both client-side and server-side validation with multiple security layers.

## Security Features

### 1. **File Type Validation**
- **MIME Type Checking**: Validates the declared MIME type
- **File Extension Validation**: Ensures allowed file extensions
- **Magic Bytes Detection**: Validates file content against known file signatures
- **Content-Type Verification**: Ensures declared type matches actual content

### 2. **File Size Validation**
- **Maximum Size Limit**: 10MB per file
- **Client-Side Pre-validation**: Prevents unnecessary uploads
- **Server-Side Enforcement**: Final validation on the server

### 3. **Filename Security**
- **Path Traversal Prevention**: Removes `../` and path separators
- **Dangerous Character Sanitization**: Replaces `< > : " | ? *` with underscores
- **Length Limitation**: Maximum 255 characters
- **Suspicious Name Detection**: Blocks files with "virus" or "malware" in name

### 4. **Content Security**
- **Executable Detection**: Blocks Windows executables (MZ header)
- **Magic Bytes Validation**: Ensures file content matches declared type
- **Office Document Validation**: Validates ZIP-based Office formats

## Supported File Types

| Type | Extensions | MIME Types | Use Case |
|------|------------|------------|----------|
| **Documents** | `.pdf`, `.doc`, `.docx` | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Study notes, assignments |
| **Presentations** | `.ppt`, `.pptx` | `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` | Slides, presentations |
| **Spreadsheets** | `.xls`, `.xlsx` | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Data, calculations |
| **Text Files** | `.txt` | `text/plain` | Simple text documents |
| **Images** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` | `image/jpeg`, `image/png`, `image/gif`, `image/webp` | Diagrams, screenshots |

## Implementation Details

### Server-Side Validation (`src/lib/fileValidation.ts`)

#### Core Functions

```typescript
// Main validation function
validateFile(file: File, config: FileValidationConfig)

// Upload request validation
validateFileUpload(req: NextRequest, config: FileValidationConfig)

// Filename sanitization
sanitizeFilename(filename: string)

// Secure filename generation
generateSecureFilename(originalName: string)
```

#### Magic Bytes Detection

The system validates file content using magic bytes:

```typescript
const MAGIC_BYTES = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [[0xFF, 0xD8, 0xFF]], // JPEG
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
  // ... more file types
};
```

#### Security Checks

1. **Size Validation**: `file.size <= maxSizeBytes`
2. **Extension Validation**: `allowedExtensions.includes(extension)`
3. **MIME Type Validation**: `allowedMimeTypes.includes(file.type)`
4. **Magic Bytes Validation**: Content matches declared type
5. **Executable Detection**: Blocks MZ headers
6. **Filename Sanitization**: Removes dangerous characters

### Client-Side Validation (`src/app/upload/page.tsx`)

#### Real-time Validation

- **Immediate Feedback**: Validates files as they're selected
- **Visual Indicators**: Green/red borders and icons
- **Error Messages**: Specific validation error details
- **Upload Prevention**: Disables upload button for invalid files

#### Validation Features

```typescript
const validateFile = (file: File) => {
  const errors: string[] = [];
  
  // Size check
  if (file.size > CLIENT_VALIDATION.maxSizeBytes) {
    errors.push(`File size exceeds 10MB limit`);
  }
  
  // Extension check
  if (!CLIENT_VALIDATION.allowedExtensions.includes(ext)) {
    errors.push(`File extension ${ext} not allowed`);
  }
  
  // MIME type check
  if (!CLIENT_VALIDATION.allowedMimeTypes.includes(file.type)) {
    errors.push(`File type ${file.type} not allowed`);
  }
  
  // ... more checks
};
```

## Configuration

### Default Configuration

```typescript
export const STUDY_MATERIAL_VALIDATION: FileValidationConfig = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    // ... more types
  ],
  allowedExtensions: [
    '.pdf',
    '.docx',
    '.doc',
    // ... more extensions
  ],
  maxFilenameLength: 255,
};
```

### Custom Configuration

You can create custom validation rules for different use cases:

```typescript
const IMAGE_ONLY_VALIDATION: FileValidationConfig = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
  maxFilenameLength: 100,
};
```

## API Integration

### Upload Endpoint (`/api/upload`)

The upload endpoint now includes comprehensive validation:

```typescript
async function uploadHandler(req: NextRequest) {
  // Validate the file upload
  const validation = await validateFileUpload(req, STUDY_MATERIAL_VALIDATION);
  
  if (!validation.isValid) {
    return NextResponse.json({ 
      error: 'File validation failed', 
      details: validation.error 
    }, { status: 400 });
  }

  // Process validated file...
}
```

### Response Format

**Success Response:**
```json
{
  "url": "https://bucket.s3.region.amazonaws.com/secure_filename.pdf",
  "filename": "1703123456789_abc123.pdf",
  "originalName": "study_notes.pdf",
  "size": 1048576,
  "type": "application/pdf"
}
```

**Error Response:**
```json
{
  "error": "File validation failed",
  "details": "File size (15.5MB) exceeds maximum allowed size (10.00MB)"
}
```

## Security Benefits

### 1. **Malware Prevention**
- Blocks executable files
- Validates file content against declared type
- Prevents path traversal attacks

### 2. **Resource Protection**
- Limits file sizes to prevent storage abuse
- Prevents oversized uploads from consuming bandwidth
- Controls storage costs

### 3. **Data Integrity**
- Ensures only appropriate file types are stored
- Maintains consistent file format standards
- Prevents corruption from invalid files

### 4. **User Experience**
- Immediate feedback on file selection
- Clear error messages for validation failures
- Prevents failed uploads due to invalid files

## Monitoring and Logging

### Security Logging

The system logs all file validation attempts:

```typescript
logFileValidation(
  filename: string,
  fileSize: number,
  mimeType: string,
  detectedType: string,
  isValid: boolean,
  error?: string
);
```

### Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "filename": "document.pdf",
  "fileSize": 1048576,
  "mimeType": "application/pdf",
  "detectedType": "application/pdf",
  "isValid": true
}
```

## Error Handling

### Common Validation Errors

1. **Size Exceeded**: File too large
2. **Invalid Extension**: File extension not allowed
3. **Invalid MIME Type**: File type not allowed
4. **Content Mismatch**: File content doesn't match declared type
5. **Executable Detected**: File appears to be executable
6. **Suspicious Filename**: Filename contains suspicious terms

### Error Response Format

All validation errors include:
- **Error Code**: Specific error identifier
- **User Message**: Human-readable error description
- **Technical Details**: Additional information for debugging

## Testing

### Manual Testing

```bash
# Test valid PDF upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@valid_document.pdf"

# Test oversized file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@large_file.pdf"

# Test invalid file type
curl -X POST http://localhost:3000/api/upload \
  -F "file=@executable.exe"
```

### Automated Testing

Create test cases for:
- Valid file uploads
- Invalid file types
- Oversized files
- Malicious filenames
- Content type mismatches

## Future Enhancements

### 1. **Virus Scanning**
- Integrate with ClamAV or VirusTotal
- Scan uploaded files for malware
- Quarantine suspicious files

### 2. **Advanced Content Analysis**
- OCR for image content
- Text extraction from PDFs
- Content filtering for inappropriate material

### 3. **Dynamic Validation**
- User role-based file type restrictions
- Time-based upload limits
- Geographic restrictions

### 4. **Enhanced Monitoring**
- Real-time validation statistics
- Anomaly detection
- Automated alerts for suspicious activity

## Production Considerations

### 1. **Performance**
- File validation adds minimal overhead
- Magic bytes checking is fast
- Client-side validation reduces server load

### 2. **Scalability**
- Validation is stateless
- No external dependencies
- Easy to scale horizontally

### 3. **Maintenance**
- Centralized validation configuration
- Easy to update allowed file types
- Comprehensive logging for debugging

### 4. **Security Updates**
- Regular updates to magic bytes signatures
- Monitoring for new file format vulnerabilities
- Keeping validation rules current

## Troubleshooting

### Common Issues

1. **File Rejected Despite Valid Type**
   - Check magic bytes signatures
   - Verify MIME type configuration
   - Review file extension list

2. **Large Files Not Uploading**
   - Verify size limit configuration
   - Check client-side validation
   - Review server timeout settings

3. **Validation Errors in Logs**
   - Check file content integrity
   - Verify filename sanitization
   - Review security rule configuration

### Debug Commands

```bash
# Check file magic bytes
file -b --mime-type filename.pdf

# Validate file size
ls -lh filename.pdf

# Check file extension
echo "${filename##*.}"
```

## Conclusion

The file validation system provides comprehensive protection against malicious uploads while maintaining a good user experience. The multi-layered approach ensures security at both client and server levels, with detailed logging for monitoring and debugging. 