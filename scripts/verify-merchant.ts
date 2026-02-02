import axios from 'axios';

const productNo = '7024065775';
const merchantIds = ['3212368', '510106611', '500268766']; // Candidates

async function test() {
    for (const mid of merchantIds) {
        const url = `https://smartstore.naver.com/i/v1/reviews/paged-reviews?page=1&pageSize=1&merchantNo=${mid}&originProductNo=${productNo}&sortType=REVIEW_RANKING`;
        try {
            console.log(`Testing Merchant ID: ${mid}`);
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Referer': `https://smartstore.naver.com/kproject/products/${productNo}`
                }
            });
            console.log(`Success with ${mid}: Found ${res.data.totalElements} reviews`);
        } catch (e: any) {
            console.log(`Failed with ${mid}: ${e.message}`);
        }
    }
}

test();
