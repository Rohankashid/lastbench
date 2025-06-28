// Test S3 Configuration
// Run this in the browser console to test S3 setup

async function testS3Config() {
  console.log('Testing S3 Configuration...');
  
  // Test 1: Check if we can list objects in the bucket
  try {
    const response = await fetch('/api/test-s3', {
      method: 'GET',
    });
    
    const result = await response.json();
    console.log('S3 Test Result:', result);
    
    return result;
  } catch (error) {
    console.error('S3 Test Error:', error);
    return { error: error.message };
  }
}

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

async function testDirectS3Delete(key) {
  console.log('Testing direct S3 deletion for key:', key);
  
  try {
    const response = await fetch('/api/test-s3-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
    return result;
  } catch (error) {
    console.error('Error testing direct S3 delete:', error);
    return { error: error.message };
  }
}

// Example usage:
// testS3Config();
// testS3Delete('https://lastbench-prod.s3.eu-north-1.amazonaws.com/03_FYP_Front Pages.pdf');
// testDirectS3Delete('03_FYP_Front Pages.pdf');

console.log('S3 Test Script Loaded');
console.log('Usage:');
console.log('- testS3Config() - Test S3 configuration');
console.log('- testS3Delete(fileUrl) - Test S3 deletion via URL');
console.log('- testDirectS3Delete(key) - Test direct S3 deletion by key'); 