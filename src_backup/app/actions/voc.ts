'use server';

import { prisma } from '@/lib/prisma';
import { crawlNaverReviews } from '@/lib/crawler';
import OpenAI from 'openai';

// Initialize OpenAI if key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

async function analyzeReview(content: string): Promise<{ sentiment: string; topics: string }> {
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "Analyze the following review. Return a JSON object with 'sentiment' (Positive, Neutral, Negative) and 'topics' (comma-separated string of up to 3 key topics like 'Noise', 'Design', 'Delivery')." },
          { role: "user", content }
        ],
        model: "gpt-3.5-turbo",
        response_format: { type: "json_object" },
      });
      
      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        sentiment: result.sentiment || 'Neutral',
        topics: result.topics || 'General'
      };
    } catch (e) {
      console.error("OpenAI analysis failed:", e);
    }
  }

  // Fallback simple analysis
  const lower = content.toLowerCase();
  let sentiment = 'Neutral';
  if (lower.includes('좋') || lower.includes('만족') || lower.includes('추천') || lower.includes('굿')) sentiment = 'Positive';
  else if (lower.includes('별로') || lower.includes('실망') || lower.includes('안좋') || lower.includes('느림')) sentiment = 'Negative';

  const topicsList = [];
  if (lower.includes('배송')) topicsList.push('Delivery');
  if (lower.includes('디자인') || lower.includes('예쁘')) topicsList.push('Design');
  if (lower.includes('소음') || lower.includes('조용')) topicsList.push('Noise');
  if (lower.includes('가격') || lower.includes('비싸') || lower.includes('저렴')) topicsList.push('Price');
  
  return {
    sentiment,
    topics: topicsList.length > 0 ? topicsList.join(', ') : 'General'
  };
}

export async function crawlAndAnalyze(url: string) {
  try {
    console.log(`Starting crawl for ${url}`);
    const reviews = await crawlNaverReviews(url);
    console.log(`Crawled ${reviews.length} reviews`);

    if (reviews.length === 0) {
      return { success: false, message: 'No reviews found or crawling failed (possibly blocked).' };
    }

    let newCount = 0;

    for (const r of reviews) {
      // Check if review already exists (by content and author to avoid duplicates if ID changes)
      // Or use the ID from Naver if it's stable. The crawler returns 'id'.
      const existing = await prisma.review.findFirst({
        where: { 
          AND: [
            { author: r.author },
            { content: r.content }
          ]
        }
      });

      if (!existing) {
        const analysis = await analyzeReview(r.content);
        
        await prisma.review.create({
          data: {
            source: 'Naver SmartStore',
            author: r.author,
            content: r.content,
            rating: r.rating,
            date: new Date(r.date), // Ensure crawler returns ISO string or Date compatible
            sentiment: analysis.sentiment,
            topics: analysis.topics,
          }
        });
        newCount++;
      }
    }

    return { success: true, message: `Successfully processed ${reviews.length} reviews. Added ${newCount} new reviews.` };
  } catch (error: any) {
    console.error('Crawl and analyze error:', error);
    return { success: false, message: error.message };
  }
}

export async function getVOCStats() {
  // Safety check for Prisma Client
  if (!prisma || !prisma.review) {
    return {
      totalReviews: 0,
      averageRating: 0,
      sentimentDistribution: { Positive: 0, Neutral: 0, Negative: 0 },
      topTopics: [],
    };
  }

  const reviews = await prisma.review.findMany();
  
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews 
    : 0;

  const sentimentDistribution = reviews.reduce((acc: any, r) => {
    acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
    return acc;
  }, { Positive: 0, Neutral: 0, Negative: 0 });

  // Simple topic extraction from stored tags
  const topicCounts: Record<string, number> = {};
  reviews.forEach(r => {
    const tags = r.topics.split(',').map(t => t.trim()).filter(t => t);
    tags.forEach(tag => {
      topicCounts[tag] = (topicCounts[tag] || 0) + 1;
    });
  });

  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));

  return {
    totalReviews,
    averageRating: averageRating.toFixed(1),
    sentimentDistribution,
    topTopics,
  };
}

export async function getReviews() {
  if (!prisma || !prisma.review) return [];
  return await prisma.review.findMany({
    orderBy: { date: 'desc' },
    take: 50,
  });
}
