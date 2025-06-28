# Delete Functionality Implementation

## Overview
This implementation adds delete functionality for both study notes and PYQs (Previous Year Questions) for admin users. The delete operation removes files from Firebase Storage and attempts S3 deletion as a fallback, as well as removing the corresponding Firestore documents.

## Current Implementation Status

### ✅ **Working Features**
- **Firebase Storage Deletion**: Files are successfully deleted from Firebase Storage
- **Firestore Document Deletion**: Database records are properly removed
- **Admin Role Protection**: Only admin users can see delete buttons
- **Confirmation Dialogs**: Prevents accidental deletions
- **UI Updates**: Immediate interface updates after deletion
- **Error Handling**: Graceful error handling with console logging

### ⚠️ **S3 Deletion Status**
- **Current Issue**: S3 deletion is not working because files are uploaded to Firebase Storage, not S3
- **Fallback Logic**: S3 deletion is attempted as a fallback when Firebase Storage fails
- **Debugging**: Added comprehensive logging to track deletion attempts

## How It Works

### 1. **File Upload Process**
- Files are uploaded to **Firebase Storage** (not S3)
- File URLs in the database are Firebase Storage URLs
- Example: `https://firebasestorage.googleapis.com/v0/b/project/o/path/file.pdf?alt=media&token=...`

### 2. **Delete Process**
1. **Confirmation Dialog**: User confirms deletion
2. **Firebase Storage Deletion**: Primary deletion method
   - Extracts file path from Firebase Storage URL
   - Deletes file using Firebase Storage SDK
3. **S3 Fallback**: Only if Firebase Storage fails
   - Attempts to delete from S3 (usually fails because file doesn't exist in S3)
4. **Firestore Cleanup**: Removes database document
5. **UI Update**: Updates the interface

### 3. **URL Pattern Recognition**
```javascript
// Firebase Storage URL pattern
const firebaseUrl = new URL(fileUrl);
const pathMatch = firebaseUrl.pathname.match(/\/o\/(.+?)\?/);
const filePath = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
```

## API Endpoints

### DELETE `/api/delete`
Deletes files from S3 storage (fallback only).

**Request Body:**
```json
{
  "fileUrl": "https://bucket-name.s3.region.amazonaws.com/file-name.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "S3 file deleted successfully"
}
```

**For Firebase Storage URLs:**
```json
{
  "success": true,
  "message": "Not an S3 URL, skipping S3 deletion",
  "note": "This appears to be a Firebase Storage URL"
}
```

## Environment Variables Required

For S3 fallback functionality:
```env
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-s3-bucket-name
```

## Debugging

### Console Logging
The implementation includes comprehensive console logging:
- File URL being processed
- Firebase Storage path extraction
- S3 deletion attempts
- Success/failure messages

### Debug Script
Use the `debug-s3-delete.js` script in browser console:
```javascript
// Test S3 deletion
testS3Delete('https://your-file-url.com/file.pdf');
```

### Common Issues

1. **"Not an S3 URL" Message**
   - This is expected for Firebase Storage URLs
   - S3 deletion is skipped because files are in Firebase Storage

2. **Firebase Storage Deletion Fails**
   - Check Firebase Storage permissions
   - Verify file path extraction
   - Check console for detailed error messages

3. **S3 Deletion Fails**
   - Expected behavior for Firebase Storage files
   - S3 deletion is only for files actually stored in S3

## Usage

### For Admin Users:
1. Navigate to `/notes` or `/pyqs`
2. Look for the red "Delete" button next to each item
3. Click the delete button
4. Confirm the deletion in the popup dialog
5. The item will be removed from Firebase Storage and database

### For Regular Users:
- Delete buttons are not visible
- No access to delete functionality

## Technical Implementation

### Key Components Modified:
- `src/app/notes/page.tsx` - Added delete functionality for study notes
- `src/app/pyqs/page.tsx` - Added delete functionality for PYQs
- `src/app/admin/page.tsx` - Enhanced delete functionality
- `src/app/api/delete/route.ts` - S3 deletion API (fallback only)

### Dependencies:
- `@aws-sdk/client-s3` - For S3 operations (fallback)
- Firebase Storage and Firestore - For primary operations

## Testing

To test the delete functionality:
1. Ensure you have admin role in your user profile
2. Upload some test materials
3. Try deleting them from different pages
4. Check console logs for detailed information
5. Verify files are removed from Firebase Storage
6. Check that Firestore documents are deleted

## Notes

- **Primary Storage**: Firebase Storage (working correctly)
- **S3 Storage**: Fallback only (not used in current implementation)
- **Deletions are permanent** and cannot be undone
- **Admin role is checked** on each page load
- **Loading states** provide user feedback during operations
- **Comprehensive logging** for debugging purposes

## Future Improvements

If you want to use S3 as primary storage:
1. Modify upload process to use S3 instead of Firebase Storage
2. Update file URL generation to use S3 URLs
3. Update delete logic to prioritize S3 deletion
4. Keep Firebase Storage as fallback 