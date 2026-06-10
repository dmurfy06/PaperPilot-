import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export interface PaperSearchResult {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  abstract: string | null;
  doi: string | null;
  url: string;
  pdfUrl: string | null;
  sources: string[];
  citationCount: number | null;
}

const FETCH_TIMEOUT_MS = 8000;
const PER_SOURCE_LIMIT = 10;

// Including a contact email opts into the faster, more reliable "polite pool"
// at OpenAlex and Crossref. Optional — requests still work without it.
const CONTACT_EMAIL = process.env.PAPER_SEARCH_CONTACT_EMAIL?.trim();
const MAILTO_PARAM = CONTACT_EMAIL ? `&mailto=${encodeURIComponent(CONTACT_EMAIL)}` : '';

// CORE indexes 270M+ open-access full texts. Optional — skipped if no key is set.
const CORE_API_KEY = process.env.CORE_API_KEY?.trim();

function timeoutSignal(): AbortSignal {
  return AbortSignal.timeout(FETCH_TIMEOUT_MS);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeDoi(doi: string | null | undefined): string | null {
  if (!doi) return null;
  return doi
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .trim() || null;
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// OpenAlex stores abstracts as { word: [positions] } — rebuild the text
function reconstructAbstract(inverted: Record<string, number[]> | null | undefined): string | null {
  if (!inverted) return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) words[pos] = word;
  }
  const text = words.join(' ').trim();
  return text || null;
}

async function searchOpenAlex(query: string): Promise<PaperSearchResult[]> {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${PER_SOURCE_LIMIT}&select=id,title,authorships,publication_year,primary_location,best_oa_location,doi,abstract_inverted_index,cited_by_count${MAILTO_PARAM}`;
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map((w: any): PaperSearchResult => ({
    id: `openalex:${w.id}`,
    title: w.title ?? 'Untitled',
    authors: (w.authorships ?? []).map((a: any) => a.author?.display_name).filter(Boolean),
    year: w.publication_year ?? null,
    venue: w.primary_location?.source?.display_name ?? null,
    abstract: reconstructAbstract(w.abstract_inverted_index),
    doi: normalizeDoi(w.doi),
    url: w.doi ?? w.id,
    pdfUrl: w.best_oa_location?.pdf_url ?? null,
    sources: ['OpenAlex'],
    citationCount: w.cited_by_count ?? null,
  }));
}

async function searchArxiv(query: string): Promise<PaperSearchResult[]> {
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=${PER_SOURCE_LIMIT}&sortBy=relevance`;
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`arXiv ${res.status}`);
  const xml = await res.text();

  const entries = xml.split('<entry>').slice(1);
  return entries.map((entry): PaperSearchResult => {
    const tag = (name: string): string | null => {
      const m = entry.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
      return m ? m[1].replace(/\s+/g, ' ').trim() : null;
    };
    const idUrl = tag('id') ?? '';
    const authors = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((m) => m[1].trim());
    const published = tag('published');
    const doiMatch = entry.match(/<arxiv:doi[^>]*>([\s\S]*?)<\/arxiv:doi>/);
    return {
      id: `arxiv:${idUrl}`,
      title: tag('title') ?? 'Untitled',
      authors,
      year: published ? new Date(published).getFullYear() : null,
      venue: 'arXiv preprint',
      abstract: tag('summary'),
      doi: normalizeDoi(doiMatch?.[1]),
      url: idUrl,
      pdfUrl: idUrl ? idUrl.replace('/abs/', '/pdf/') : null,
      sources: ['arXiv'],
      citationCount: null,
    };
  });
}

async function searchCrossref(query: string): Promise<PaperSearchResult[]> {
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${PER_SOURCE_LIMIT}&select=DOI,title,author,published,container-title,abstract,URL,is-referenced-by-count${MAILTO_PARAM}`;
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`Crossref ${res.status}`);
  const data = await res.json();
  return (data.message?.items ?? [])
    .filter((item: any) => item.title?.[0])
    .map((item: any): PaperSearchResult => ({
      id: `crossref:${item.DOI}`,
      title: stripTags(item.title[0]),
      authors: (item.author ?? [])
        .map((a: any) => [a.given, a.family].filter(Boolean).join(' '))
        .filter(Boolean),
      year: item.published?.['date-parts']?.[0]?.[0] ?? null,
      venue: item['container-title']?.[0] ?? null,
      abstract: item.abstract ? stripTags(item.abstract) : null,
      doi: normalizeDoi(item.DOI),
      url: item.URL ?? `https://doi.org/${item.DOI}`,
      pdfUrl: null,
      sources: ['Crossref'],
      citationCount: item['is-referenced-by-count'] ?? null,
    }));
}

async function searchEuropePmc(query: string): Promise<PaperSearchResult[]> {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=${PER_SOURCE_LIMIT}&resultType=core`;
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`Europe PMC ${res.status}`);
  const data = await res.json();
  return (data.resultList?.result ?? []).map((r: any): PaperSearchResult => {
    const pdfUrl =
      (r.fullTextUrlList?.fullTextUrl ?? []).find(
        (u: any) => u.documentStyle === 'pdf' && (u.availabilityCode === 'OA' || u.availability === 'Open access')
      )?.url ?? null;
    return {
      id: `europepmc:${r.id}`,
      title: r.title ?? 'Untitled',
      authors: r.authorString ? r.authorString.replace(/\.$/, '').split(', ') : [],
      year: r.pubYear ? parseInt(r.pubYear, 10) : null,
      venue: r.journalTitle ?? r.journalInfo?.journal?.title ?? null,
      abstract: r.abstractText ? stripTags(r.abstractText) : null,
      doi: normalizeDoi(r.doi),
      url: r.doi ? `https://doi.org/${r.doi}` : `https://europepmc.org/article/${r.source}/${r.id}`,
      pdfUrl,
      sources: ['Europe PMC'],
      citationCount: r.citedByCount ?? null,
    };
  });
}

async function searchSemanticScholar(query: string): Promise<PaperSearchResult[]> {
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${PER_SOURCE_LIMIT}&fields=title,authors,year,venue,abstract,externalIds,openAccessPdf,citationCount,url`;
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`Semantic Scholar ${res.status}`);
  const data = await res.json();
  return (data.data ?? []).map((p: any): PaperSearchResult => ({
    id: `s2:${p.paperId}`,
    title: p.title ?? 'Untitled',
    authors: (p.authors ?? []).map((a: any) => a.name).filter(Boolean),
    year: p.year ?? null,
    venue: p.venue || null,
    abstract: p.abstract ?? null,
    doi: normalizeDoi(p.externalIds?.DOI),
    url: p.url ?? (p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : ''),
    pdfUrl: p.openAccessPdf?.url ?? null,
    sources: ['Semantic Scholar'],
    citationCount: p.citationCount ?? null,
  }));
}

async function searchDoaj(query: string): Promise<PaperSearchResult[]> {
  const url = `https://doaj.org/api/v2/search/articles/${encodeURIComponent(query)}?pageSize=${PER_SOURCE_LIMIT}`;
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`DOAJ ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map((r: any): PaperSearchResult => {
    const bj = r.bibjson ?? {};
    const doi = (bj.identifier ?? []).find((id: any) => id.type === 'doi')?.id ?? null;
    const fulltext = (bj.link ?? []).find((l: any) => l.type === 'fulltext');
    const isPdf = fulltext?.content_type?.toLowerCase().includes('pdf');
    return {
      id: `doaj:${r.id}`,
      title: bj.title ?? 'Untitled',
      authors: (bj.author ?? []).map((a: any) => a.name).filter(Boolean),
      year: bj.year ? parseInt(bj.year, 10) : null,
      venue: bj.journal?.title ?? null,
      abstract: bj.abstract ? stripTags(bj.abstract) : null,
      doi: normalizeDoi(doi),
      url: doi ? `https://doi.org/${doi}` : fulltext?.url ?? '',
      pdfUrl: isPdf ? fulltext.url : null,
      sources: ['DOAJ'],
      citationCount: null,
    };
  });
}

async function searchPubmed(query: string): Promise<PaperSearchResult[]> {
  // Step 1: search for PubMed IDs
  const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=${PER_SOURCE_LIMIT}`;
  const idRes = await fetch(esearchUrl, { signal: timeoutSignal() });
  if (!idRes.ok) throw new Error(`PubMed esearch ${idRes.status}`);
  const idData = await idRes.json();
  const ids: string[] = idData.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  // Step 2: fetch summaries for those IDs
  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
  const sumRes = await fetch(summaryUrl, { signal: timeoutSignal() });
  if (!sumRes.ok) throw new Error(`PubMed esummary ${sumRes.status}`);
  const sumData = await sumRes.json();
  const result = sumData.result ?? {};

  return ids
    .map((id): PaperSearchResult | null => {
      const r = result[id];
      if (!r) return null;
      const doi = (r.articleids ?? []).find((a: any) => a.idtype === 'doi')?.value ?? null;
      const year = r.pubdate ? parseInt(String(r.pubdate).slice(0, 4), 10) : null;
      return {
        id: `pubmed:${id}`,
        title: r.title ? stripTags(r.title) : 'Untitled',
        authors: (r.authors ?? []).map((a: any) => a.name).filter(Boolean),
        year: Number.isNaN(year) ? null : year,
        venue: r.fulljournalname ?? r.source ?? null,
        abstract: null, // esummary omits abstracts; efetch would be a third request
        doi: normalizeDoi(doi),
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        pdfUrl: null,
        sources: ['PubMed'],
        citationCount: null,
      };
    })
    .filter((r): r is PaperSearchResult => r !== null);
}

async function searchDblp(query: string): Promise<PaperSearchResult[]> {
  const url = `https://dblp.org/search/publ/api?q=${encodeURIComponent(query)}&format=json&h=${PER_SOURCE_LIMIT}`;
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`DBLP ${res.status}`);
  const data = await res.json();
  const hits = data.result?.hits?.hit ?? [];
  return hits.map((hit: any): PaperSearchResult => {
    const info = hit.info ?? {};
    // authors.author can be a single object or an array; each is {text} or a string
    const rawAuthors = info.authors?.author;
    const authorList = Array.isArray(rawAuthors) ? rawAuthors : rawAuthors ? [rawAuthors] : [];
    const authors = authorList.map((a: any) => (typeof a === 'string' ? a : a.text)).filter(Boolean);
    return {
      id: `dblp:${hit['@id'] ?? info.key ?? info.url}`,
      title: info.title ? stripTags(String(info.title)) : 'Untitled',
      authors,
      year: info.year ? parseInt(info.year, 10) : null,
      venue: info.venue ?? null,
      abstract: null, // DBLP does not provide abstracts
      doi: normalizeDoi(info.doi),
      url: info.ee ?? info.url ?? (info.doi ? `https://doi.org/${info.doi}` : ''),
      pdfUrl: null,
      sources: ['DBLP'],
      citationCount: null,
    };
  });
}

async function searchOpenAire(query: string): Promise<PaperSearchResult[]> {
  const url = `https://api.openaire.eu/search/publications?keywords=${encodeURIComponent(query)}&format=json&size=${PER_SOURCE_LIMIT}`;
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`OpenAIRE ${res.status}`);
  const data = await res.json();

  // OpenAIRE's JSON is deeply nested and field shapes vary — parse defensively
  const asArray = (v: any): any[] => (Array.isArray(v) ? v : v != null ? [v] : []);
  const pickText = (v: any): string | null => {
    if (v == null) return null;
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return pickText(v.find((x) => x?.['@classid'] === 'main title') ?? v[0]);
    if (typeof v === 'object') return v['$'] ?? v.content ?? null;
    return null;
  };

  const rawResults = asArray(data.response?.results?.result);
  return rawResults
    .map((el: any): PaperSearchResult | null => {
      const meta = el.metadata?.['oaf:entity']?.['oaf:result'];
      if (!meta) return null;
      const title = pickText(meta.title);
      if (!title) return null;
      const authors = asArray(meta.creator).map(pickText).filter((a): a is string => Boolean(a));
      const dateStr = pickText(meta.dateofacceptance);
      const year = dateStr ? parseInt(dateStr.slice(0, 4), 10) : null;
      const doi = asArray(meta.pid).find((p: any) => p?.['@classid'] === 'doi')?.['$'] ?? null;
      // Find an open-access PDF web resource if present
      let pdfUrl: string | null = null;
      for (const inst of asArray(meta.children?.instance)) {
        const access = inst.accessright?.['@classid'];
        const webUrl = pickText(inst.webresource?.url ?? asArray(inst.webresource)[0]?.url);
        if (webUrl && (access === 'OPEN' || !pdfUrl)) {
          if (access === 'OPEN') { pdfUrl = webUrl; break; }
        }
      }
      return {
        id: `openaire:${pickText(el.header?.['dri:objIdentifier']) ?? title}`,
        title: stripTags(title),
        authors,
        year: year && !Number.isNaN(year) ? year : null,
        venue: pickText(meta.publisher),
        abstract: meta.description ? stripTags(pickText(meta.description) ?? '') || null : null,
        doi: normalizeDoi(doi),
        url: doi ? `https://doi.org/${doi}` : pdfUrl ?? '',
        pdfUrl,
        sources: ['OpenAIRE'],
        citationCount: null,
      };
    })
    .filter((r): r is PaperSearchResult => r !== null);
}

async function searchCore(query: string): Promise<PaperSearchResult[]> {
  if (!CORE_API_KEY) return [];
  const url = `https://api.core.ac.uk/v3/search/works?q=${encodeURIComponent(query)}&limit=${PER_SOURCE_LIMIT}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${CORE_API_KEY}` },
    signal: timeoutSignal(),
  });
  if (!res.ok) throw new Error(`CORE ${res.status}`);
  const data = await res.json();
  return (data.results ?? [])
    .filter((w: any) => w.title)
    .map((w: any): PaperSearchResult => ({
      id: `core:${w.id}`,
      title: stripTags(w.title),
      authors: (w.authors ?? []).map((a: any) => a.name).filter(Boolean),
      year: w.yearPublished ?? null,
      venue: w.publisher ?? (w.journals?.[0]?.title ?? null),
      abstract: w.abstract ? stripTags(w.abstract) : null,
      doi: normalizeDoi(w.doi),
      url: w.doi ? `https://doi.org/${w.doi}` : (w.downloadUrl ?? ''),
      pdfUrl: w.downloadUrl ?? null,
      sources: ['CORE'],
      citationCount: w.citationCount ?? null,
    }));
}

// Unpaywall finds a legal open-access PDF for a DOI when the source didn't supply one.
// Requires a contact email (PAPER_SEARCH_CONTACT_EMAIL). Runs as a second pass after merge.
async function enrichWithUnpaywall(results: PaperSearchResult[]): Promise<void> {
  if (!CONTACT_EMAIL) return;

  // Only look up results that still lack a PDF but have a DOI; cap to avoid latency
  const candidates = results.filter((r) => !r.pdfUrl && r.doi).slice(0, 15);

  await Promise.allSettled(
    candidates.map(async (result) => {
      const url = `https://api.unpaywall.org/v2/${encodeURIComponent(result.doi!)}?email=${encodeURIComponent(CONTACT_EMAIL!)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return;
      const data = await res.json();
      const pdf = data.best_oa_location?.url_for_pdf;
      if (pdf) {
        result.pdfUrl = pdf;
        if (!result.sources.includes('Unpaywall')) result.sources.push('Unpaywall');
      }
    })
  );
}

// Merge duplicate entries: prefer the one with a PDF link, keep the union of sources
function mergeResults(groups: PaperSearchResult[][]): PaperSearchResult[] {
  const byKey = new Map<string, PaperSearchResult>();
  const order: string[] = [];

  // Round-robin interleave so every source's top results surface
  const maxLen = Math.max(...groups.map((g) => g.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const group of groups) {
      const result = group[i];
      if (!result || !result.title || result.title === 'Untitled') continue;
      const key = result.doi ?? normalizeTitle(result.title);
      if (!key) continue;

      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, { ...result });
        order.push(key);
      } else {
        existing.sources = [...new Set([...existing.sources, ...result.sources])];
        existing.pdfUrl = existing.pdfUrl ?? result.pdfUrl;
        existing.abstract = existing.abstract ?? result.abstract;
        existing.venue = existing.venue ?? result.venue;
        existing.year = existing.year ?? result.year;
        existing.doi = existing.doi ?? result.doi;
        if (existing.authors.length === 0) existing.authors = result.authors;
        existing.citationCount = Math.max(existing.citationCount ?? 0, result.citationCount ?? 0) || existing.citationCount;
      }
    }
  }

  return order.map((key) => byKey.get(key)!);
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query) {
    return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
  }
  if (query.length > 300) {
    return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
  }

  const searches = [
    searchOpenAlex(query),
    searchArxiv(query),
    searchCrossref(query),
    searchEuropePmc(query),
    searchSemanticScholar(query),
    searchDoaj(query),
    searchPubmed(query),
    searchDblp(query),
    searchOpenAire(query),
    searchCore(query),
  ];

  const settled = await Promise.allSettled(searches);
  const groups = settled
    .filter((s): s is PromiseFulfilledResult<PaperSearchResult[]> => s.status === 'fulfilled')
    .map((s) => s.value);
  const failedCount = settled.filter((s) => s.status === 'rejected').length;

  if (groups.length === 0) {
    return NextResponse.json(
      { error: 'All paper databases are currently unreachable. Please try again shortly.' },
      { status: 502 }
    );
  }

  const results = mergeResults(groups).slice(0, 30);

  // Second pass: fill in missing free-PDF links via Unpaywall (mutates results in place)
  await enrichWithUnpaywall(results);

  return NextResponse.json({
    results,
    sourcesQueried: searches.length,
    sourcesFailed: failedCount,
  });
}
