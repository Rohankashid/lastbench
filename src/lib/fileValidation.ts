import { NextRequest} from 'next/server';

export interface FileValidationConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxFilenameLength: number;
}

export const STUDY_MATERIAL_VALIDATION: FileValidationConfig = {
  maxSizeBytes: 100 * 1024 * 1024, 
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'application/vnd.ms-excel', 
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  allowedExtensions: [
    '.pdf',
    '.docx',
    '.doc',
    '.pptx',
    '.ppt',
    '.xlsx',
    '.xls',
    '.txt',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
  ],
  maxFilenameLength: 255,
};

// Magic bytes for file type detection
const MAGIC_BYTES: { [key: string]: number[][] } = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [[0xFF, 0xD8, 0xFF]], // JPEG
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a, GIF89a
  'image/webp': [[0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]], // RIFF....WEBP
  'text/plain': [[0xEF, 0xBB, 0xBF], [0xFF, 0xFE], [0xFE, 0xFF]], // UTF-8 BOM, UTF-16 LE, UTF-16 BE
};

// Office document magic bytes (simplified - these are complex)
const OFFICE_MAGIC_BYTES = [
  [0x50, 0x4B, 0x03, 0x04], // ZIP header (for .docx, .pptx, .xlsx)
  [0x50, 0x4B, 0x05, 0x06], // ZIP end of central directory
  [0x50, 0x4B, 0x07, 0x08], // ZIP central directory
];

/**
 * Check if a buffer starts with specific magic bytes
 */
function hasMagicBytes(buffer: Buffer, magicBytes: number[][]): boolean {
  return magicBytes.some(bytes => {
    if (buffer.length < bytes.length) return false;
    return bytes.every((byte, index) => buffer[index] === byte);
  });
}

/**
 * Detect file type from magic bytes
 */
function detectFileTypeFromMagicBytes(buffer: Buffer): string | null {
  // Check PDF
  if (hasMagicBytes(buffer, MAGIC_BYTES['application/pdf'])) {
    return 'application/pdf';
  }
  
  // Check images
  if (hasMagicBytes(buffer, MAGIC_BYTES['image/jpeg'])) {
    return 'image/jpeg';
  }
  if (hasMagicBytes(buffer, MAGIC_BYTES['image/png'])) {
    return 'image/png';
  }
  if (hasMagicBytes(buffer, MAGIC_BYTES['image/gif'])) {
    return 'image/gif';
  }
  if (hasMagicBytes(buffer, MAGIC_BYTES['image/webp'])) {
    return 'image/webp';
  }
  
  // Check text files
  if (hasMagicBytes(buffer, MAGIC_BYTES['text/plain'])) {
    return 'text/plain';
  }
  
  // Check Office documents (ZIP-based)
  if (hasMagicBytes(buffer, OFFICE_MAGIC_BYTES)) {
    // This is a simplified check - real Office document validation is more complex
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  
  return null;
}


export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '');
  
  // Remove or replace dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = name.substring(0, 255 - ext!.length - 1) + '.' + ext;
  }
  
  // Ensure it's not empty
  if (!sanitized || sanitized === '.') {
    sanitized = 'uploaded_file';
  }
  
  return sanitized;
}

/**
 * Validate file extension
 */
function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
  file: File,
  config: FileValidationConfig = STUDY_MATERIAL_VALIDATION
): Promise<{ isValid: boolean; error?: string; detectedType?: string }> {
  try {
    // 1. Check file size
    if (file.size > config.maxSizeBytes) {
      return {
        isValid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(config.maxSizeBytes / 1024 / 1024).toFixed(2)}MB)`,
      };
    }

    // 2. Check filename length
    if (file.name.length > config.maxFilenameLength) {
      return {
        isValid: false,
        error: `Filename is too long (${file.name.length} characters). Maximum allowed: ${config.maxFilenameLength} characters`,
      };
    }

    // 3. Validate file extension
    if (!validateFileExtension(file.name, config.allowedExtensions)) {
      return {
        isValid: false,
        error: `File extension not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`,
      };
    }

    // 4. Validate MIME type
    if (!config.allowedMimeTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type (${file.type}) not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`,
      };
    }

    // 5. Read file content for magic bytes validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 6. Detect file type from magic bytes
    const detectedType = detectFileTypeFromMagicBytes(buffer);
    
    if (detectedType && !config.allowedMimeTypes.includes(detectedType)) {
      return {
        isValid: false,
        error: `File content type (${detectedType}) does not match declared type (${file.type}). This may indicate a malicious file.`,
        detectedType,
      };
    }

    // 7. Additional security checks
    if (file.name.toLowerCase().includes('virus') || file.name.toLowerCase().includes('malware')) {
      return {
        isValid: false,
        error: 'Suspicious filename detected',
      };
    }

    // 8. Check for executable content (basic check)
    const firstBytes = buffer.slice(0, 4);
    if (firstBytes[0] === 0x4D && firstBytes[1] === 0x5A) { // MZ header (Windows executable)
      return {
        isValid: false,
        error: 'Executable files are not allowed',
        detectedType: 'application/x-executable',
      };
    }

    return {
      isValid: true,
      detectedType: detectedType || file.type,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Generate a secure filename with timestamp and random string
 */
export function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  const sanitizedExt = sanitizeFilename(ext);
  
  return `${timestamp}_${random}${sanitizedExt}`;
}

/**
 * Validate file upload request
 */
export async function validateFileUpload(
  req: NextRequest,
  config: FileValidationConfig = STUDY_MATERIAL_VALIDATION
): Promise<{ isValid: boolean; error?: string; file?: File; sanitizedFilename?: string }> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return {
        isValid: false,
        error: 'No file uploaded',
      };
    }

    // Validate the file
    const validation = await validateFile(file, config);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        error: validation.error!,
      };
    }

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(file.name);

    return {
      isValid: true,
      file,
      sanitizedFilename,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `File upload validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Log file validation for security monitoring
 */
export function logFileValidation(
  filename: string,
  fileSize: number,
  mimeType: string,
  detectedType: string,
  isValid: boolean,
  error?: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    filename,
    fileSize,
    mimeType,
    detectedType,
    isValid,
    error,
  };

  if (!isValid) {
    console.warn('File validation failed:', logEntry);
  } else {
    console.log('File validation passed:', logEntry);
  }
} 