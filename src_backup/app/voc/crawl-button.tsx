'use client';

import { useState } from 'react';
import { crawlAndAnalyze } from '@/app/actions/voc';

export default function CrawlButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState('https://smartstore.naver.com/kproject/products/7024065775?sn=3212368');
  const [message, setMessage] = useState('');

  const handleCrawl = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const result = await crawlAndAnalyze(url);
      setMessage(result.message);
      if (result.success) {
        // Refresh the page to show new data
        window.location.reload();
      }
    } catch (error) {
      setMessage('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Live Data Ingestion</h3>
      <div className="flex gap-4">
        <input 
          type="text" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter Naver SmartStore Product URL"
        />
        <button 
          onClick={handleCrawl}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Crawling...' : 'Crawl & Analyze'}
        </button>
      </div>
      {message && (
        <p className={`mt-3 text-sm ${message.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
