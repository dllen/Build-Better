import React, { useState, useEffect } from 'react';
import { XMLParser } from 'fast-xml-parser';
import { ExternalLink, RefreshCw, Rss, Search, LayoutTemplate, List } from 'lucide-react';

const OPML_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Blog Feeds</title>
  </head>
  <body>
    <outline text="Blogs" title="Blogs">
      <outline type="rss" text="simonwillison.net" title="simonwillison.net" xmlUrl="https://simonwillison.net/atom/everything/" htmlUrl="https://simonwillison.net"/>
      <outline type="rss" text="jeffgeerling.com" title="jeffgeerling.com" xmlUrl="https://www.jeffgeerling.com/blog.xml" htmlUrl="https://jeffgeerling.com"/>
      <outline type="rss" text="seangoedecke.com" title="seangoedecke.com" xmlUrl="https://www.seangoedecke.com/rss.xml" htmlUrl="https://seangoedecke.com"/>
      <outline type="rss" text="krebsonsecurity.com" title="krebsonsecurity.com" xmlUrl="https://krebsonsecurity.com/feed/" htmlUrl="https://krebsonsecurity.com"/>
      <outline type="rss" text="daringfireball.net" title="daringfireball.net" xmlUrl="https://daringfireball.net/feeds/main" htmlUrl="https://daringfireball.net"/>
      <outline type="rss" text="ericmigi.com" title="ericmigi.com" xmlUrl="https://ericmigi.com/rss.xml" htmlUrl="https://ericmigi.com"/>
      <outline type="rss" text="antirez.com" title="antirez.com" xmlUrl="http://antirez.com/rss" htmlUrl="http://antirez.com"/>
      <outline type="rss" text="idiallo.com" title="idiallo.com" xmlUrl="https://idiallo.com/feed.rss" htmlUrl="https://idiallo.com"/>
      <outline type="rss" text="maurycyz.com" title="maurycyz.com" xmlUrl="https://maurycyz.com/index.xml" htmlUrl="https://maurycyz.com"/>
      <outline type="rss" text="pluralistic.net" title="pluralistic.net" xmlUrl="https://pluralistic.net/feed/" htmlUrl="https://pluralistic.net"/>
      <outline type="rss" text="shkspr.mobi" title="shkspr.mobi" xmlUrl="https://shkspr.mobi/blog/feed/" htmlUrl="https://shkspr.mobi"/>
      <outline type="rss" text="lcamtuf.substack.com" title="lcamtuf.substack.com" xmlUrl="https://lcamtuf.substack.com/feed" htmlUrl="https://lcamtuf.substack.com"/>
      <outline type="rss" text="mitchellh.com" title="mitchellh.com" xmlUrl="https://mitchellh.com/feed.xml" htmlUrl="https://mitchellh.com"/>
      <outline type="rss" text="dynomight.net" title="dynomight.net" xmlUrl="https://dynomight.net/feed.xml" htmlUrl="https://dynomight.net"/>
      <outline type="rss" text="utcc.utoronto.ca/~cks" title="utcc.utoronto.ca/~cks" xmlUrl="https://utcc.utoronto.ca/~cks/space/blog/?atom" htmlUrl="https://utcc.utoronto.ca/~cks"/>
      <outline type="rss" text="xeiaso.net" title="xeiaso.net" xmlUrl="https://xeiaso.net/blog.rss" htmlUrl="https://xeiaso.net"/>
      <outline type="rss" text="devblogs.microsoft.com/oldnewthing" title="devblogs.microsoft.com/oldnewthing" xmlUrl="https://devblogs.microsoft.com/oldnewthing/feed" htmlUrl="https://devblogs.microsoft.com/oldnewthing"/>
      <outline type="rss" text="righto.com" title="righto.com" xmlUrl="https://www.righto.com/feeds/posts/default" htmlUrl="https://righto.com"/>
      <outline type="rss" text="lucumr.pocoo.org" title="lucumr.pocoo.org" xmlUrl="https://lucumr.pocoo.org/feed.atom" htmlUrl="https://lucumr.pocoo.org"/>
      <outline type="rss" text="skyfall.dev" title="skyfall.dev" xmlUrl="https://skyfall.dev/rss.xml" htmlUrl="https://skyfall.dev"/>
      <outline type="rss" text="garymarcus.substack.com" title="garymarcus.substack.com" xmlUrl="https://garymarcus.substack.com/feed" htmlUrl="https://garymarcus.substack.com"/>
      <outline type="rss" text="rachelbythebay.com" title="rachelbythebay.com" xmlUrl="https://rachelbythebay.com/w/atom.xml" htmlUrl="https://rachelbythebay.com"/>
      <outline type="rss" text="overreacted.io" title="overreacted.io" xmlUrl="https://overreacted.io/rss.xml" htmlUrl="https://overreacted.io"/>
      <outline type="rss" text="timsh.org" title="timsh.org" xmlUrl="https://timsh.org/rss/" htmlUrl="https://timsh.org"/>
      <outline type="rss" text="johndcook.com" title="johndcook.com" xmlUrl="https://www.johndcook.com/blog/feed/" htmlUrl="https://johndcook.com"/>
      <outline type="rss" text="gilesthomas.com" title="gilesthomas.com" xmlUrl="https://gilesthomas.com/feed/rss.xml" htmlUrl="https://gilesthomas.com"/>
      <outline type="rss" text="matklad.github.io" title="matklad.github.io" xmlUrl="https://matklad.github.io/feed.xml" htmlUrl="https://matklad.github.io"/>
      <outline type="rss" text="derekthompson.org" title="derekthompson.org" xmlUrl="https://www.theatlantic.com/feed/author/derek-thompson/" htmlUrl="https://derekthompson.org"/>
      <outline type="rss" text="evanhahn.com" title="evanhahn.com" xmlUrl="https://evanhahn.com/feed.xml" htmlUrl="https://evanhahn.com"/>
      <outline type="rss" text="terriblesoftware.org" title="terriblesoftware.org" xmlUrl="https://terriblesoftware.org/feed/" htmlUrl="https://terriblesoftware.org"/>
      <outline type="rss" text="rakhim.exotext.com" title="rakhim.exotext.com" xmlUrl="https://rakhim.exotext.com/rss.xml" htmlUrl="https://rakhim.exotext.com"/>
      <outline type="rss" text="joanwestenberg.com" title="joanwestenberg.com" xmlUrl="https://joanwestenberg.com/rss" htmlUrl="https://joanwestenberg.com"/>
      <outline type="rss" text="xania.org" title="xania.org" xmlUrl="https://xania.org/feed" htmlUrl="https://xania.org"/>
      <outline type="rss" text="micahflee.com" title="micahflee.com" xmlUrl="https://micahflee.com/feed/" htmlUrl="https://micahflee.com"/>
      <outline type="rss" text="nesbitt.io" title="nesbitt.io" xmlUrl="https://nesbitt.io/feed.xml" htmlUrl="https://nesbitt.io"/>
      <outline type="rss" text="construction-physics.com" title="construction-physics.com" xmlUrl="https://www.construction-physics.com/feed" htmlUrl="https://construction-physics.com"/>
      <outline type="rss" text="tedium.co" title="tedium.co" xmlUrl="https://feed.tedium.co/" htmlUrl="https://tedium.co"/>
      <outline type="rss" text="susam.net" title="susam.net" xmlUrl="https://susam.net/feed.xml" htmlUrl="https://susam.net"/>
      <outline type="rss" text="entropicthoughts.com" title="entropicthoughts.com" xmlUrl="https://entropicthoughts.com/feed.xml" htmlUrl="https://entropicthoughts.com"/>
      <outline type="rss" text="buttondown.com/hillelwayne" title="buttondown.com/hillelwayne" xmlUrl="https://buttondown.com/hillelwayne/rss" htmlUrl="https://buttondown.com/hillelwayne"/>
      <outline type="rss" text="dwarkesh.com" title="dwarkesh.com" xmlUrl="https://www.dwarkeshpatel.com/feed" htmlUrl="https://dwarkesh.com"/>
      <outline type="rss" text="borretti.me" title="borretti.me" xmlUrl="https://borretti.me/feed.xml" htmlUrl="https://borretti.me"/>
      <outline type="rss" text="wheresyoured.at" title="wheresyoured.at" xmlUrl="https://www.wheresyoured.at/rss/" htmlUrl="https://wheresyoured.at"/>
      <outline type="rss" text="jayd.ml" title="jayd.ml" xmlUrl="https://jayd.ml/feed.xml" htmlUrl="https://jayd.ml"/>
      <outline type="rss" text="minimaxir.com" title="minimaxir.com" xmlUrl="https://minimaxir.com/index.xml" htmlUrl="https://minimaxir.com"/>
      <outline type="rss" text="geohot.github.io" title="geohot.github.io" xmlUrl="https://geohot.github.io/blog/feed.xml" htmlUrl="https://geohot.github.io"/>
      <outline type="rss" text="paulgraham.com" title="paulgraham.com" xmlUrl="http://www.aaronsw.com/2002/feeds/pgessays.rss" htmlUrl="https://paulgraham.com"/>
      <outline type="rss" text="filfre.net" title="filfre.net" xmlUrl="https://www.filfre.net/feed/" htmlUrl="https://filfre.net"/>
      <outline type="rss" text="blog.jim-nielsen.com" title="blog.jim-nielsen.com" xmlUrl="https://blog.jim-nielsen.com/feed.xml" htmlUrl="https://blog.jim-nielsen.com"/>
      <outline type="rss" text="dfarq.homeip.net" title="dfarq.homeip.net" xmlUrl="https://dfarq.homeip.net/feed/" htmlUrl="https://dfarq.homeip.net"/>
      <outline type="rss" text="jyn.dev" title="jyn.dev" xmlUrl="https://jyn.dev/atom.xml" htmlUrl="https://jyn.dev"/>
      <outline type="rss" text="geoffreylitt.com" title="geoffreylitt.com" xmlUrl="https://www.geoffreylitt.com/feed.xml" htmlUrl="https://geoffreylitt.com"/>
      <outline type="rss" text="downtowndougbrown.com" title="downtowndougbrown.com" xmlUrl="https://www.downtowndougbrown.com/feed/" htmlUrl="https://downtowndougbrown.com"/>
      <outline type="rss" text="brutecat.com" title="brutecat.com" xmlUrl="https://brutecat.com/rss.xml" htmlUrl="https://brutecat.com"/>
      <outline type="rss" text="eli.thegreenplace.net" title="eli.thegreenplace.net" xmlUrl="https://eli.thegreenplace.net/feeds/all.atom.xml" htmlUrl="https://eli.thegreenplace.net"/>
      <outline type="rss" text="abortretry.fail" title="abortretry.fail" xmlUrl="https://www.abortretry.fail/feed" htmlUrl="https://abortretry.fail"/>
      <outline type="rss" text="fabiensanglard.net" title="fabiensanglard.net" xmlUrl="https://fabiensanglard.net/rss.xml" htmlUrl="https://fabiensanglard.net"/>
      <outline type="rss" text="oldvcr.blogspot.com" title="oldvcr.blogspot.com" xmlUrl="https://oldvcr.blogspot.com/feeds/posts/default" htmlUrl="https://oldvcr.blogspot.com"/>
      <outline type="rss" text="bogdanthegeek.github.io" title="bogdanthegeek.github.io" xmlUrl="https://bogdanthegeek.github.io/blog/index.xml" htmlUrl="https://bogdanthegeek.github.io"/>
      <outline type="rss" text="hugotunius.se" title="hugotunius.se" xmlUrl="https://hugotunius.se/feed.xml" htmlUrl="https://hugotunius.se"/>
      <outline type="rss" text="gwern.net" title="gwern.net" xmlUrl="https://gwern.substack.com/feed" htmlUrl="https://gwern.net"/>
      <outline type="rss" text="berthub.eu" title="berthub.eu" xmlUrl="https://berthub.eu/articles/index.xml" htmlUrl="https://berthub.eu"/>
      <outline type="rss" text="chadnauseam.com" title="chadnauseam.com" xmlUrl="https://chadnauseam.com/rss.xml" htmlUrl="https://chadnauseam.com"/>
      <outline type="rss" text="simone.org" title="simone.org" xmlUrl="https://simone.org/feed/" htmlUrl="https://simone.org"/>
      <outline type="rss" text="it-notes.dragas.net" title="it-notes.dragas.net" xmlUrl="https://it-notes.dragas.net/feed/" htmlUrl="https://it-notes.dragas.net"/>
      <outline type="rss" text="beej.us" title="beej.us" xmlUrl="https://beej.us/blog/rss.xml" htmlUrl="https://beej.us"/>
      <outline type="rss" text="hey.paris" title="hey.paris" xmlUrl="https://hey.paris/index.xml" htmlUrl="https://hey.paris"/>
      <outline type="rss" text="danielwirtz.com" title="danielwirtz.com" xmlUrl="https://danielwirtz.com/rss.xml" htmlUrl="https://danielwirtz.com"/>
      <outline type="rss" text="matduggan.com" title="matduggan.com" xmlUrl="https://matduggan.com/rss/" htmlUrl="https://matduggan.com"/>
      <outline type="rss" text="refactoringenglish.com" title="refactoringenglish.com" xmlUrl="https://refactoringenglish.com/index.xml" htmlUrl="https://refactoringenglish.com"/>
      <outline type="rss" text="worksonmymachine.substack.com" title="worksonmymachine.substack.com" xmlUrl="https://worksonmymachine.substack.com/feed" htmlUrl="https://worksonmymachine.substack.com"/>
      <outline type="rss" text="philiplaine.com" title="philiplaine.com" xmlUrl="https://philiplaine.com/index.xml" htmlUrl="https://philiplaine.com"/>
      <outline type="rss" text="steveblank.com" title="steveblank.com" xmlUrl="https://steveblank.com/feed/" htmlUrl="https://steveblank.com"/>
      <outline type="rss" text="bernsteinbear.com" title="bernsteinbear.com" xmlUrl="https://bernsteinbear.com/feed.xml" htmlUrl="https://bernsteinbear.com"/>
      <outline type="rss" text="danieldelaney.net" title="danieldelaney.net" xmlUrl="https://danieldelaney.net/feed" htmlUrl="https://danieldelaney.net"/>
      <outline type="rss" text="troyhunt.com" title="troyhunt.com" xmlUrl="https://www.troyhunt.com/rss/" htmlUrl="https://troyhunt.com"/>
      <outline type="rss" text="herman.bearblog.dev" title="herman.bearblog.dev" xmlUrl="https://herman.bearblog.dev/feed/" htmlUrl="https://herman.bearblog.dev"/>
      <outline type="rss" text="tomrenner.com" title="tomrenner.com" xmlUrl="https://tomrenner.com/index.xml" htmlUrl="https://tomrenner.com"/>
      <outline type="rss" text="blog.pixelmelt.dev" title="blog.pixelmelt.dev" xmlUrl="https://blog.pixelmelt.dev/rss/" htmlUrl="https://blog.pixelmelt.dev"/>
      <outline type="rss" text="martinalderson.com" title="martinalderson.com" xmlUrl="https://martinalderson.com/feed.xml" htmlUrl="https://martinalderson.com"/>
      <outline type="rss" text="danielchasehooper.com" title="danielchasehooper.com" xmlUrl="https://danielchasehooper.com/feed.xml" htmlUrl="https://danielchasehooper.com"/>
      <outline type="rss" text="chiark.greenend.org.uk/~sgtatham" title="chiark.greenend.org.uk/~sgtatham" xmlUrl="https://www.chiark.greenend.org.uk/~sgtatham/quasiblog/feed.xml" htmlUrl="https://chiark.greenend.org.uk/~sgtatham"/>
      <outline type="rss" text="grantslatton.com" title="grantslatton.com" xmlUrl="https://grantslatton.com/rss.xml" htmlUrl="https://grantslatton.com"/>
      <outline type="rss" text="experimental-history.com" title="experimental-history.com" xmlUrl="https://www.experimental-history.com/feed" htmlUrl="https://experimental-history.com"/>
      <outline type="rss" text="anildash.com" title="anildash.com" xmlUrl="https://anildash.com/feed.xml" htmlUrl="https://anildash.com"/>
      <outline type="rss" text="aresluna.org" title="aresluna.org" xmlUrl="https://aresluna.org/main.rss" htmlUrl="https://aresluna.org"/>
      <outline type="rss" text="michael.stapelberg.ch" title="michael.stapelberg.ch" xmlUrl="https://michael.stapelberg.ch/feed.xml" htmlUrl="https://michael.stapelberg.ch"/>
      <outline type="rss" text="miguelgrinberg.com" title="miguelgrinberg.com" xmlUrl="https://blog.miguelgrinberg.com/feed" htmlUrl="https://miguelgrinberg.com"/>
      <outline type="rss" text="keygen.sh" title="keygen.sh" xmlUrl="https://keygen.sh/blog/feed.xml" htmlUrl="https://keygen.sh"/>
      <outline type="rss" text="mjg59.dreamwidth.org" title="mjg59.dreamwidth.org" xmlUrl="https://mjg59.dreamwidth.org/data/rss" htmlUrl="https://mjg59.dreamwidth.org"/>
      <outline type="rss" text="computer.rip" title="computer.rip" xmlUrl="https://computer.rip/rss.xml" htmlUrl="https://computer.rip"/>
      <outline type="rss" text="tedunangst.com" title="tedunangst.com" xmlUrl="https://www.tedunangst.com/flak/rss" htmlUrl="https://tedunangst.com"/>
    </outline>
  </body>
</opml>`;

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  source: string;
}

interface FeedSource {
  title: string;
  xmlUrl: string;
  htmlUrl: string;
}

export default function RssReader() {
  const [feeds, setFeeds] = useState<FeedSource[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);

  useEffect(() => {
    // Parse OPML content
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: ""
    });
    const result = parser.parse(OPML_CONTENT);
    
    // Extract feeds from OPML structure
    // Structure: opml -> body -> outline -> outline (array)
    const outlines = result.opml?.body?.outline?.outline || [];
    const extractedFeeds: FeedSource[] = outlines.map((outline: any) => ({
      title: outline.text || outline.title,
      xmlUrl: outline.xmlUrl,
      htmlUrl: outline.htmlUrl
    }));
    
    setFeeds(extractedFeeds);
    
    // Initial fetch of some feeds
    fetchFeeds(extractedFeeds.slice(0, 5)); // Fetch first 5 to start
  }, []);

  const fetchFeeds = async (feedSources: FeedSource[]) => {
    setLoading(true);
    const allItems: FeedItem[] = [];
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: ""
    });

    for (const feed of feedSources) {
      try {
        // Use a CORS proxy to fetch the RSS feed
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(feed.xmlUrl)}`);
        const text = await response.text();
        const feedData = parser.parse(text);
        
        let channelItems = [];
        if (feedData.rss?.channel?.item) {
          channelItems = Array.isArray(feedData.rss.channel.item) 
            ? feedData.rss.channel.item 
            : [feedData.rss.channel.item];
        } else if (feedData.feed?.entry) {
          // Atom support
          channelItems = Array.isArray(feedData.feed.entry) 
            ? feedData.feed.entry 
            : [feedData.feed.entry];
        }

        const normalizedItems = channelItems.map((item: any) => ({
          title: item.title,
          link: item.link?.href || item.link, // Atom uses link.href
          pubDate: item.pubDate || item.published || item.updated,
          contentSnippet: item.description || item.summary || item.content?.["#text"] || "",
          source: feed.title
        })).slice(0, 5); // Limit to 5 items per feed

        allItems.push(...normalizedItems);
      } catch (error) {
        console.error(`Failed to fetch feed ${feed.title}:`, error);
      }
    }

    // Sort by date (newest first)
    allItems.sort((a, b) => {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    setItems(prev => {
        // Simple dedup based on link
        const existingLinks = new Set(prev.map(i => i.link));
        const newItems = allItems.filter(i => !existingLinks.has(i.link));
        return [...prev, ...newItems].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    });
    setLoading(false);
  };

  const handleRefresh = () => {
    setItems([]);
    fetchFeeds(feeds.slice(0, 10)); // Refresh first 10
  };

  const handleFeedSelect = (xmlUrl: string) => {
    setSelectedFeed(xmlUrl);
    setItems([]);
    const feed = feeds.find(f => f.xmlUrl === xmlUrl);
    if (feed) {
      fetchFeeds([feed]);
    }
  };

  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
              <Rss className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                RSS Reader
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Aggregated feeds from HN popular blogs
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search articles..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none w-full md:w-64"
              />
            </div>
            <button 
              onClick={handleRefresh}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-colors"
              title="Refresh Feeds"
            >
              <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Feed List */}
          <div className="lg:col-span-1 bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-hidden h-[calc(100vh-250px)] flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0">
              <h2 className="font-semibold text-slate-300 flex items-center gap-2">
                <List className="w-4 h-4" />
                Sources ({feeds.length})
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <button
                onClick={() => { setSelectedFeed(null); handleRefresh(); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedFeed ? 'bg-orange-500/20 text-orange-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                All Feeds
              </button>
              {feeds.map((feed) => (
                <button
                  key={feed.xmlUrl}
                  onClick={() => handleFeedSelect(feed.xmlUrl)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${selectedFeed === feed.xmlUrl ? 'bg-orange-500/20 text-orange-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  title={feed.title}
                >
                  {feed.title}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content - Article List */}
          <div className="lg:col-span-3 space-y-4">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
                  <p>Loading feeds...</p>
                </div>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid gap-4">
                {filteredItems.map((item, index) => (
                  <article 
                    key={`${item.link}-${index}`}
                    className="group bg-slate-900/50 border border-slate-800/50 rounded-xl p-5 hover:border-orange-500/30 hover:bg-slate-900 transition-all duration-300"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-orange-400 bg-orange-950/30 px-2 py-1 rounded-full border border-orange-500/20">
                          {item.source}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(item.pubDate).toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-slate-200 group-hover:text-orange-400 transition-colors line-clamp-2">
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          {item.title}
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </h3>
                      
                      {item.contentSnippet && (
                        <div 
                          className="text-sm text-slate-400 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: item.contentSnippet.replace(/<[^>]*>/g, '').substring(0, 300) + '...' }}
                        />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                <p>No articles found. Try selecting a feed or refreshing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
