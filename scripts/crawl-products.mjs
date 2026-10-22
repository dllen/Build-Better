// Crawl all products from 10015.io/product-finder via SSR __NEXT_DATA__
// Writes incrementally and deduplicates by slug
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const MAX_PAGES = 10;
const OUTPUT = 'public/data/product-finder.json';
const seen = new Set();

async function fetchPage(cursor) {
  const url = cursor
    ? `https://10015.io/product-finder?cursor=${encodeURIComponent(cursor)}`
    : 'https://10015.io/product-finder';

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!match) return null;
  return JSON.parse(match[1]).props.pageProps;
}

async function main() {
  let allProducts = [];
  let cursor = null;
  let pageNum = 0;
  let metadata = null;

  do {
    pageNum++;
    if (pageNum > MAX_PAGES) {
      console.log(`Reached max pages limit (${MAX_PAGES})`);
      break;
    }

    try {
      const props = await fetchPage(cursor);
      if (!props) break;

      if (!metadata) {
        metadata = { categories: props.categories, tags: props.tags, total: props.total };
        console.log(`Total reported: ${props.total}, categories: ${props.categories.length}`);
      }

      let newCount = 0;
      for (const p of props.products) {
        if (seen.has(p.slug)) continue;
        seen.add(p.slug);
        newCount++;
        allProducts.push({
          name: p.name,
          slug: p.slug,
          tagline: p.tagline || '',
          description: p.description || '',
          website: p.website || '',
          logo: p.logo || '',
          thumbnail: p.thumbnail || p.logo || '',
          tags: (p.tags || []).map((t) => t.name),
          pricing_type: p.pricing_type || 'Free',
          status: p.status || '',
          created_at: p.created_at || '',
        });
      }

      console.log(`Page ${pageNum}: ${props.products.length} fetched, ${newCount} new (total: ${allProducts.length})`);

      // Write incrementally
      writeFileSync(OUTPUT, JSON.stringify({ metadata, products: allProducts }));
      console.log(`  Saved ${allProducts.length} products to ${OUTPUT}`);

      if (newCount === 0) {
        console.log('No new products — stopping');
        break;
      }

      cursor = props.nextCursor;
      if (!props.hasMore) {
        console.log('hasMore is false — stopping');
        break;
      }

      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`Error on page ${pageNum}: ${err.message}`);
      // Save what we have and exit
      if (allProducts.length > 0) {
        writeFileSync(OUTPUT, JSON.stringify({ metadata, products: allProducts }));
        console.log(`Saved ${allProducts.length} products before exit`);
      }
      break;
    }
  } while (cursor);

  console.log(`\nDone: ${allProducts.length} unique products`);
  console.log(`File: ${(JSON.stringify({ metadata, products: allProducts }).length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);