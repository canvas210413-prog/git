'use server';

import { prisma } from '@/lib/prisma';
import { crawlNaverReviews } from '@/lib/crawler';
import { analyzeReviewAI } from '@/lib/ai';

async function analyzeReview(content: string): Promise<{ sentiment: string; topics: string }> {
  try {
    const analysis = await analyzeReviewAI(content);
    return {
      sentiment: analysis.sentiment,
      topics: analysis.topics
    };
  } catch (error) {
    console.error("Review analysis failed:", error);
    // Fallback to simple analysis
    const lower = content.toLowerCase();
    let sentiment = 'Neutral';
    if (lower.includes('좋') || lower.includes('만족') || lower.includes('추천') || lower.includes('굿')) sentiment = 'Positive';
    else if (lower.includes('별로') || lower.includes('실망') || lower.includes('안좋') || lower.includes('느림')) sentiment = 'Negative';

    const topicsList = [];
    if (lower.includes('배송')) topicsList.push('배송');
    if (lower.includes('디자인') || lower.includes('예쁘')) topicsList.push('디자인');
    if (lower.includes('소음') || lower.includes('조용')) topicsList.push('소음');
    if (lower.includes('가격') || lower.includes('비싸') || lower.includes('저렴')) topicsList.push('가격');
    
    return {
      sentiment,
      topics: topicsList.length > 0 ? topicsList.join(', ') : 'General'
    };
  }
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
    const sentiment = r.sentiment || 'Neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, { Positive: 0, Neutral: 0, Negative: 0 });

  // Simple topic extraction from stored tags
  const topicCounts: Record<string, number> = {};
  reviews.forEach(r => {
    const tags = (r.topics || '').split(',').map(t => t.trim()).filter(t => t);
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
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
