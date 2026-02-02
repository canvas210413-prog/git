import React from 'react';
import { getVOCStats, getReviews } from '@/app/actions/voc';
import CrawlButton from './crawl-button';

export default async function VOCPage() {
  const stats = await getVOCStats();
  const reviews = await getReviews();

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">VOC Analysis Dashboard</h1>
        <p className="text-slate-500 mb-8">Real-time customer feedback analysis and opinion mining</p>

        <CrawlButton />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500">Total Reviews</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalReviews}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500">Average Rating</h3>
            <div className="flex items-baseline mt-2">
              <p className="text-3xl font-bold text-slate-900">{stats.averageRating}</p>
              <span className="ml-2 text-sm text-slate-400">/ 5.0</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500">Sentiment Score</h3>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${(stats.sentimentDistribution.Positive / stats.totalReviews) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-green-600">
                {Math.round((stats.sentimentDistribution.Positive / stats.totalReviews) * 100)}% Positive
              </span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500">Critical Issues</h3>
            <p className="text-3xl font-bold text-red-500 mt-2">
              {stats.sentimentDistribution.Negative}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Review List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Recent Feedback</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {reviews.map((review: any) => (
                  <div key={review.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          review.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                          review.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {review.sentiment}
                        </span>
                        <span className="text-sm font-medium text-slate-900">{review.author}</span>
                        <span className="text-sm text-slate-400">• {review.source}</span>
                      </div>
                      <span className="text-sm text-slate-400">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-3">{review.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {review.topics.split(',').map((tag: string, i: number) => (
                        <span key={i} className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Topics & Insights */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Trending Topics</h2>
              <div className="space-y-4">
                {stats.topTopics.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-slate-600">{item.topic}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(item.count / stats.totalReviews) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">AI Insight</h2>
              <p className="text-sm text-blue-800 leading-relaxed">
                Customers are highly satisfied with the <strong>Noise Level</strong> and <strong>Design</strong>. 
                The product is frequently recommended for <strong>Households with Infants</strong> and <strong>Pet Owners</strong>.
                <br/><br/>
                <strong>Action Item:</strong> Consider highlighting "Quiet Operation" and "Pet Odor Removal" in upcoming marketing campaigns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
