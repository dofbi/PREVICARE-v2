import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    // category: z.enum(['general', 'documents', 'ipres', 'juridique', 'carriere', 'technique']),
    category: z.enum(['general', 'documents', 'juridique', 'technique']),
    order: z.number(),
  }),
});

export const collections = { faq };
