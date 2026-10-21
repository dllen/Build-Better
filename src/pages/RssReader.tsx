import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ExternalLink, RefreshCw, Rss, Search, List, AlertCircle, Plus, Trash2, BookOpen, Bookmark, X, Check } from "lucide-react";
import { SEO } from "@/components/seo";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { toolSEOContent } from "@/data/tool-seo-content";

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
      <outline type="rss" text="geoffreylitt.com" title="geoffreylitt.com" xmlUrl="https://www.geoffreylitt.com/feed.xml" htmlUrl="https://www.geoffreylitt.com"/>
      <outline type="rss" text="downtowndougbrown.com" title="downtowndougbrown.com" xmlUrl="https://www.downtowndougbrown.com/feed/" htmlUrl="https://www.downtowndougbrown.com"/>
      <outline type="rss" text="brutecat.com" title="brutecat.com" xmlUrl="https://brutecat.com/rss.xml" htmlUrl="https://brutecat.com"/>
      <outline type="rss" text="eli.thegreenplace.net" title="eli.thegreenplace.net" xmlUrl="https://eli.thegreenplace.net/feeds/all.atom.xml" htmlUrl="https://eli.thegreenplace.net"/>
      <outline type="rss" text="abortretry.fail" title="abortretry.fail" xmlUrl="https://www.abortretry.fail/feed" htmlUrl="https://www.abortretry.fail"/>
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
      <outline type="rss" text="chiark.greenend.org.uk/~sgtatham" title="chiark.greenend.org.uk/~sgtatham" xmlUrl="https://www.chiark.greenend.org.uk/~sgtatham/quasiblog/feed.xml" htmlUrl="https://www.chiark.greenend.org.uk/~sgtatham"/>
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
  summary: string;
  content?: string;
  source: string;
}

interface FeedSource {
  title: string;
  xmlUrl: string;
  htmlUrl: string;
}

interface ProxyFeed {
  title: string;
  link: string;
  description?: string;
  items: FeedItem[];
}

const MAX_ITEMS_PER_FEED = 5;
const INITIAL_FEED_COUNT = 5;
const REFRESH_FEED_COUNT = 10;
const CUSTOM_FEEDS_KEY = 'rss-custom-feeds-v1';
const READ_ITEMS_KEY = 'rss-read-items-v1';
const READ_LATER_KEY = 'rss-read-later-v1';

type ViewFilter = 'all' | 'unread' | 'read-later';

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function RssReader() {
  const [feeds, setFeeds] = useState<FeedSource[]>([]);
  const [customFeeds, setCustomFeeds] = useState<FeedSource[]>([]);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [readItems, setReadItems] = useState<Set<string>>(new Set());
  const [readLater, setReadLater] = useState<Set<string>>(new Set());
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [detailItem, setDetailItem] = useState<FeedItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allFeeds = useMemo(() => [...feeds, ...customFeeds], [feeds, customFeeds]);

  useEffect(() => {
    try {
      const rawRead = localStorage.getItem(READ_ITEMS_KEY);
      if (rawRead) {
        const parsed = JSON.parse(rawRead) as string[];
        setReadItems(new Set(parsed));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(READ_ITEMS_KEY, JSON.stringify(Array.from(readItems)));
    } catch {
      // ignore
    }
  }, [readItems]);

  useEffect(() => {
    try {
      const rawLater = localStorage.getItem(READ_LATER_KEY);
      if (rawLater) {
        const parsed = JSON.parse(rawLater) as string[];
        setReadLater(new Set(parsed));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(READ_LATER_KEY, JSON.stringify(Array.from(readLater)));
    } catch {
      // ignore
    }
  }, [readLater]);

  const markAsRead = useCallback((link: string) => {
    setReadItems((prev) => new Set([...prev, link]));
  }, []);

  const toggleReadLater = useCallback((link: string) => {
    setReadLater((prev) => {
      const next = new Set(prev);
      if (next.has(link)) {
        next.delete(link);
      } else {
        next.add(link);
      }
      return next;
    });
  }, []);

  const isRead = useCallback((link: string) => readItems.has(link), [readItems]);
  const isReadLater = useCallback((link: string) => readLater.has(link), [readLater]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_FEEDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FeedSource[];
        if (Array.isArray(parsed)) {
          setCustomFeeds(parsed.filter((f) => f && f.xmlUrl && isValidUrl(f.xmlUrl)));
        }
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_FEEDS_KEY, JSON.stringify(customFeeds));
    } catch {
      // ignore storage errors
    }
  }, [customFeeds]);

  const fetchSingleFeed = useCallback(async (feed: FeedSource): Promise<FeedItem[]> => {
    const proxyUrl = `/api/rss/proxy?url=${encodeURIComponent(feed.xmlUrl)}`;
    try {
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as ProxyFeed;
      return (data.items || []).slice(0, MAX_ITEMS_PER_FEED).map((item) => ({
        ...item,
        source: feed.title,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load ${feed.title}: ${message}`);
    }
  }, []);

  const fetchFeeds = useCallback(async (feedSources: FeedSource[]) => {
    setLoading(true);
    setErrors([]);

    const results = await Promise.allSettled(
      feedSources.map((feed) => fetchSingleFeed(feed))
    );

    const newItems: FeedItem[] = [];
    const newErrors: string[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        newItems.push(...result.value);
      } else {
        newErrors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    });

    setItems((prev) => {
      const seen = new Set(prev.map((i) => i.link));
      const unique = newItems.filter((i) => !seen.has(i.link));
      return [...prev, ...unique].sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );
    });

    setErrors(newErrors);
    setLoading(false);
  }, [fetchSingleFeed]);

  useEffect(() => {
    const parseOpml = async () => {
      const { XMLParser } = await import('fast-xml-parser');
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
      });
      const result = parser.parse(OPML_CONTENT);

      const outlines = result.opml?.body?.outline?.outline || [];
      const extractedFeeds: FeedSource[] = outlines.map((outline: Record<string, string>) => ({
        title: outline.text || outline.title,
        xmlUrl: outline.xmlUrl,
        htmlUrl: outline.htmlUrl,
      }));

      setFeeds(extractedFeeds);
      fetchFeeds(extractedFeeds.slice(0, INITIAL_FEED_COUNT));
    };
    parseOpml();
  }, [fetchFeeds]);

  const handleRefresh = () => {
    setItems([]);
    const source = selectedFeed
      ? allFeeds.filter((f) => f.xmlUrl === selectedFeed)
      : allFeeds.slice(0, REFRESH_FEED_COUNT);
    fetchFeeds(source);
  };

  const handleFeedSelect = (xmlUrl: string) => {
    setSelectedFeed(xmlUrl);
    setItems([]);
    const feed = allFeeds.find((f) => f.xmlUrl === xmlUrl);
    if (feed) {
      fetchFeeds([feed]);
    }
  };

  const handleSelectAll = () => {
    setSelectedFeed(null);
    setItems([]);
    fetchFeeds(allFeeds.slice(0, INITIAL_FEED_COUNT));
  };

  const handleAddCustomFeed = async () => {
    const url = newFeedUrl.trim();
    if (!isValidUrl(url)) {
      setErrors(['Please enter a valid http:// or https:// feed URL']);
      return;
    }

    if (allFeeds.some((f) => f.xmlUrl === url)) {
      setErrors(['This feed has already been added']);
      return;
    }

    setIsAdding(true);
    setErrors([]);

    try {
      const proxyUrl = `/api/rss/proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      const data = (await response.json()) as ProxyFeed;
      const feed: FeedSource = {
        title: data.title || new URL(url).hostname,
        xmlUrl: url,
        htmlUrl: data.link || url,
      };
      setCustomFeeds((prev) => [...prev, feed]);
      setNewFeedUrl('');
      fetchFeeds([feed]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrors([`Failed to add feed: ${message}`]);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCustomFeed = (xmlUrl: string) => {
    setCustomFeeds((prev) => prev.filter((f) => f.xmlUrl !== xmlUrl));
    if (selectedFeed === xmlUrl) {
      setSelectedFeed(null);
      setItems([]);
    }
  };

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let result = items;
    if (viewFilter === 'unread') {
      result = result.filter((item) => !readItems.has(item.link));
    } else if (viewFilter === 'read-later') {
      result = result.filter((item) => readLater.has(item.link));
    }
    if (!term) return result;
    return result.filter(
      (item) =>
        item.title?.toLowerCase().includes(term) ||
        item.source.toLowerCase().includes(term)
    );
  }, [items, searchTerm, viewFilter, readItems, readLater]);

  const unreadCount = useMemo(
    () => items.filter((item) => !readItems.has(item.link)).length,
    [items, readItems]
  );
  const readLaterCount = useMemo(() => readLater.size, [readLater]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <SEO
        title={toolSEOContent['rss-read']?.title || 'RSS Reader'}
        description={toolSEOContent['rss-read']?.description || 'Read aggregated RSS feeds.'}
        keywords={['rss', 'feed', 'reader', 'aggregator']}
      />
      {toolSEOContent['rss-read'] && <ToolPageSEO data={toolSEOContent['rss-read']} />}

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <Rss className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">RSS Reader</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Aggregated feeds from popular blogs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-full md:w-64"
              />
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 bg-background border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Refresh Feeds"
              type="button"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                Some feeds could not be loaded
              </p>
              <ul className="text-sm text-destructive/80 mt-1 space-y-0.5">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="lg:hidden">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-card border border-border rounded-lg hover:bg-accent transition-colors"
            type="button"
          >
            <List className="w-4 h-4" />
            {sidebarOpen ? 'Hide feeds' : 'Show feeds'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className={`lg:col-span-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col ${
            sidebarOpen ? 'block' : 'hidden lg:flex'
          } h-[calc(100vh-250px)]`}>
            <div className="p-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0">
              <h2 className="font-semibold text-card-foreground flex items-center gap-2">
                <List className="w-4 h-4" />
                Sources ({allFeeds.length})
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <div className="mb-2 space-y-2">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Add feed URL..."
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCustomFeed();
                      }
                    }}
                    className="flex-1 min-w-0 px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                  <button
                    onClick={handleAddCustomFeed}
                    disabled={isAdding}
                    className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    title="Add feed"
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {customFeeds.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1">
                    Paste an RSS/Atom URL above to add your own feed.
                  </p>
                )}
              </div>
              <button
                onClick={handleSelectAll}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedFeed
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                type="button"
              >
                All Feeds
              </button>
              {allFeeds.map((feed) => {
                const isCustom = customFeeds.some((f) => f.xmlUrl === feed.xmlUrl);
                return (
                  <div
                    key={feed.xmlUrl}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedFeed === feed.xmlUrl
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <button
                      onClick={() => handleFeedSelect(feed.xmlUrl)}
                      className="flex-1 text-left truncate"
                      title={feed.title}
                      type="button"
                    >
                      {feed.title}
                    </button>
                    {isCustom && (
                      <button
                        onClick={() => handleRemoveCustomFeed(feed.xmlUrl)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove feed"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-full sm:w-auto overflow-x-auto">
                {(['all', 'unread', 'read-later'] as ViewFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setViewFilter(filter)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      viewFilter === filter
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    type="button"
                  >
                    {filter === 'all' && `All (${items.length})`}
                    {filter === 'unread' && `Unread (${unreadCount})`}
                    {filter === 'read-later' && `Read Later (${readLaterCount})`}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {viewFilter === 'all' && `${items.length} articles`}
                {viewFilter === 'unread' && `${unreadCount} unread`}
                {viewFilter === 'read-later' && `${readLaterCount} saved`}
              </p>
            </div>

            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  <p>Loading feeds...</p>
                </div>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid gap-4">
                {filteredItems.map((item, index) => {
                  const read = isRead(item.link);
                  const saved = isReadLater(item.link);
                  return (
                    <article
                      key={`${item.link}-${index}`}
                      className={`group bg-card border rounded-xl p-5 transition-all duration-300 ${
                        read
                          ? 'border-border opacity-80'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
                            {item.source}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.pubDate)}
                          </span>
                        </div>

                        <h3 className={`text-lg font-semibold transition-colors line-clamp-2 ${
                          read ? 'text-muted-foreground' : 'text-card-foreground group-hover:text-primary'
                        }`}>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markAsRead(item.link)}
                            className="flex items-center gap-2"
                          >
                            {item.title}
                            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </a>
                        </h3>

                        {item.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {stripHtml(item.summary).slice(0, 300)}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => {
                              setDetailItem(item);
                              markAsRead(item.link);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                            type="button"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Read
                          </button>
                          <button
                            onClick={() => toggleReadLater(item.link)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                              saved
                                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                                : 'bg-background border-border text-foreground hover:bg-accent'
                            }`}
                            type="button"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                            {saved ? 'Saved' : 'Read later'}
                          </button>
                          {!read && (
                            <button
                              onClick={() => markAsRead(item.link)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors"
                              type="button"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                <p>No articles found. Try selecting a feed or refreshing.</p>
              </div>
            )}
          </div>
        </div>

        {detailItem && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
            onClick={() => setDetailItem(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative w-full max-w-3xl bg-card text-card-foreground border border-border rounded-2xl shadow-xl my-8 p-6 md:p-8 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setDetailItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors"
                type="button"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-primary">{detailItem.source}</span>
                <span>·</span>
                <span>{formatDate(detailItem.pubDate)}</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold leading-tight pr-8">
                {detailItem.title}
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={detailItem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open original
                </a>
                <button
                  onClick={() => toggleReadLater(detailItem.link)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    isReadLater(detailItem.link)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-accent'
                  }`}
                  type="button"
                >
                  <Bookmark className={`w-4 h-4 ${isReadLater(detailItem.link) ? 'fill-current' : ''}`} />
                  {isReadLater(detailItem.link) ? 'Saved' : 'Read later'}
                </button>
              </div>

              <div className="prose prose-neutral dark:prose-invert max-w-none pt-2">
                {detailItem.content ? (
                  <div
                    className="text-card-foreground leading-relaxed [&_*]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: detailItem.content }}
                  />
                ) : detailItem.summary ? (
                  <p className="text-card-foreground leading-relaxed whitespace-pre-wrap">
                    {stripHtml(detailItem.summary)}
                  </p>
                ) : (
                  <p className="text-muted-foreground">No content available.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
