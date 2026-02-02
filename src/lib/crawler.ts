import puppeteer from 'puppeteer';

export interface CrawledReview {
  id: string;
  content: string;
  author: string;
  date: string;
  rating: number;
}

export async function crawlNaverReviews(productUrl: string): Promise<CrawledReview[]> {
  console.log('Launching Puppeteer...');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // Use 'new' or true. 'new' is deprecated in newer versions, true is standard.
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for some environments
    });
    const page = await browser.newPage();

    // Set a realistic User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    console.log(`Navigating to ${productUrl}...`);
    await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Extract merchantNo and productNo from the page context
    // This runs inside the browser, so it has access to window objects
    const config = await page.evaluate(() => {
      // Try to find the global state or config objects Naver uses
      // @ts-ignore
      const state = window.__PRELOADED_STATE__;
      // @ts-ignore
      const smartStore = window.smartStore; // Sometimes available
      
      let merchantNo = '';
      let productNo = '';

      if (state && state.product && state.product.A) {
          merchantNo = state.product.A.channel.id;
          productNo = state.product.A.id;
      }
      
      // Fallback strategies inside browser
      if (!merchantNo) {
          // Try to find it in the DOM or scripts if needed, but let's rely on the API fetch trick
      }

      return { merchantNo, productNo };
    });

    console.log('Extracted Config:', config);

    // Even better strategy:
    // We can use page.evaluate to perform the fetch request *from the browser context*
    // This automatically uses the correct cookies and session headers.
    
    // We need to find the merchantNo to construct the URL, OR we can just scrape the visible reviews if they are rendered.
    // But the API is cleaner.
    
    // Let's try to find the merchantNo from the URL if extraction failed
    let merchantNo = config.merchantNo;
    let productNo = config.productNo;

    if (!merchantNo) {
        const urlObj = new URL(productUrl);
        const sn = urlObj.searchParams.get('sn');
        if (sn) merchantNo = sn;
    }
    
    if (!productNo) {
         const urlObj = new URL(productUrl);
         const parts = urlObj.pathname.split('/');
         productNo = parts[parts.length - 1];
    }

    if (!merchantNo) {
        // Fallback for kproject
        if (productUrl.includes('kproject')) merchantNo = '510106611';
    }

    console.log(`Fetching reviews via Browser Fetch for Merchant: ${merchantNo}, Product: ${productNo}`);

    // Execute fetch inside the browser
    let reviews = await page.evaluate(async (mNo, pNo) => {
        try {
            // Try API first
            if (mNo && pNo) {
                const apiUrl = `https://smartstore.naver.com/i/v1/reviews/paged-reviews?page=1&pageSize=20&merchantNo=${mNo}&originProductNo=${pNo}&sortType=REVIEW_RANKING`;
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    if (data.contents && data.contents.length > 0) {
                        return data.contents.map((r: any) => ({
                            id: r.id.toString(),
                            content: r.reviewContent,
                            author: r.writerMemberId,
                            date: r.createDate.split('T')[0],
                            rating: r.reviewScore
                        }));
                    }
                }
            }
            return null; // Fallback to DOM
        } catch (e) {
            return null; // Fallback to DOM
        }
    }, merchantNo, productNo);

    if (!reviews) {
        console.log('API fetch failed or returned empty. Falling back to DOM scraping...');
        
        // Wait for the review list to appear
        try {
            // Use a selector based on the user provided HTML
            // List item: li[data-shp-contents-type="review"]
            await page.waitForSelector('li[data-shp-contents-type="review"]', { timeout: 5000 });
        } catch (e) {
            console.log('Timeout waiting for review list selector.');
        }

        reviews = await page.evaluate(() => {
            const items = document.querySelectorAll('li[data-shp-contents-type="review"]');
            const results: any[] = [];

            items.forEach((item) => {
                try {
                    // Extract ID
                    const id = item.getAttribute('data-shp-contents-id') || Math.random().toString(36).substring(7);

                    // Extract Rating
                    const ratingEl = item.querySelector('em.n6zq2yy0KA');
                    const rating = ratingEl ? parseInt(ratingEl.textContent || '0', 10) : 0;

                    // Extract Author
                    const authorEl = item.querySelector('.Db9Dtnf7gY strong');
                    const author = authorEl ? authorEl.textContent?.trim() || 'Anonymous' : 'Anonymous';

                    // Extract Date
                    // The date is usually in a span next to the author in .Db9Dtnf7gY
                    const dateEl = item.querySelector('.Db9Dtnf7gY span.MX91DFZo2F');
                    let date = dateEl ? dateEl.textContent?.trim() || '' : '';
                    // Format date if needed (e.g., 25.11.19. -> 2025-11-19)
                    if (date.endsWith('.')) date = date.slice(0, -1);
                    // Simple fix for YY.MM.DD to YYYY-MM-DD assuming 20xx
                    const dateParts = date.split('.');
                    if (dateParts.length === 3) {
                        date = `20${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
                    }

                    // Extract Content
                    // Content is in .KqJ8Qqw082 span.MX91DFZo2F
                    // Sometimes there are other spans for tags like "One Month Usage"
                    const contentContainer = item.querySelector('.KqJ8Qqw082');
                    let content = '';
                    if (contentContainer) {
                        // Try to find the specific span with the text
                        // It usually shares the class MX91DFZo2F
                        const textSpan = contentContainer.querySelector('span.MX91DFZo2F');
                        if (textSpan) {
                            content = textSpan.textContent?.trim() || '';
                        } else {
                            content = contentContainer.textContent?.trim() || '';
                        }
                    }

                    if (content) {
                        results.push({
                            id,
                            content,
                            author,
                            date,
                            rating
                        });
                    }
                } catch (err) {
                    // Skip item on error
                }
            });
            return results;
        });
    }

    if (reviews && Array.isArray(reviews) && reviews.length > 0) {
        console.log(`Successfully fetched ${reviews.length} reviews.`);
        return reviews;
    } else {
        console.log('No reviews found via API or DOM.');
        return [];
    }

  } catch (error) {
    console.error('Puppeteer Crawl Failed:', error);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}
