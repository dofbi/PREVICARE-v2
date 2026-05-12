import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import https from 'https';

const client = new S3Client({
  endpoint: 'https://previcare.lon1.digitaloceanspaces.com',
  region: 'lon1',
  credentials: {
    accessKeyId: 'DO801Y7RCQW78ZRC46MH',
    secretAccessKey: 'x7koDLMsKwHqXajODGTcDNk0qfc4sUwLQEs5QE4fq4o'
  },
  forcePathStyle: true,
  requestHandler: {
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
  }
});

(async () => {
  try {
    const command = new ListObjectsV2Command({ Bucket: 'previcare' });
    const result = await client.send(command);
    console.log('Objects in bucket:');
    if (result.Contents) {
      result.Contents.forEach(obj => {
        console.log(`  - ${obj.Key} (${obj.Size} bytes)`);
      });
    } else {
      console.log('  No objects found');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Code:', error.Code);
  }
})();
