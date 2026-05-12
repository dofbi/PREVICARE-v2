import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const client = new S3Client({
  endpoint: process.env.SPACES_ENDPOINT,
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY
  }
});

async function uploadIndex() {
  try {
    console.log('📤 Chargement de index.json vers Spaces...');
    
    const fileContent = readFileSync('../_PRD/index.json', 'utf-8');
    const index = JSON.parse(fileContent);
    index.last_updated = new Date().toISOString();
    
    const categoryCounts: Record<string, number> = {};
    index.articles.forEach((article: any) => {
      const slug = article.category_slug;
      categoryCounts[slug] = (categoryCounts[slug] || 0) + 1;
    });
    
    index.categories = index.categories.map((cat: any) => ({
      ...cat,
      article_count: categoryCounts[cat.slug] || 0
    }));
    
    console.log(`📊 Version: ${index.version}`);
    console.log(`📚 Articles: ${index.articles.length}`);
    
    console.log(`\n📋 Répartition par catégorie:`);
    index.categories.forEach(cat => {
      console.log(`  - ${cat.icon} ${cat.name}: ${cat.article_count} articles`);
    });
    
    const command = new PutObjectCommand({
      Bucket: process.env.SPACES_BUCKET_NAME,
      Key: 'index.json',
      Body: JSON.stringify(index, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=300'
    });
    
    await client.send(command);
    
    console.log(`\n✅ Upload terminé avec succès!`);
    console.log(`📍 URL: ${process.env.SPACES_ENDPOINT}/index.json`);
    console.log(`📦 Bucket: ${process.env.SPACES_BUCKET_NAME}`);
    console.log(`\n🎯 Testez maintenant:`);
    console.log(`   http://localhost:5000/espace-employes/juridique/juritheque`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:', error);
    process.exit(1);
  }
}

uploadIndex();
