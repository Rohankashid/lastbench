// Debug script for S3 deletion
// Run this in the browser console to test S3 deletion

async function testS3Delete(fileUrl) {
  console.log('Testing S3 deletion for:', fileUrl);
  
  try {
    const response = await fetch('/api/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl }),
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
    return result;
  } catch (error) {
    console.error('Error testing S3 delete:', error);
    return { error: error.message };
  }
}

// Example usage:
// testS3Delete('https://your-bucket.s3.region.amazonaws.com/file.pdf');

// To test with a Firebase Storage URL:
// testS3Delete('https://firebasestorage.googleapis.com/v0/b/your-project/o/path%2Fto%2Ffile.pdf?alt=media&token=...');

console.log('S3 Delete Debug Script Loaded');
console.log('Usage: testS3Delete(fileUrl)'); 