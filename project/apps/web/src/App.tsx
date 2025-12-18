import {
  ExternalLink,
  Flame,
  Search,
  Trophy,
  Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

// Types matching backend response
interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface StreamRanking {
  id: string;
  streamerId: string;
  platform: 'TWITCH' | 'YOUTUBE' | 'KICK';
  title: string;
  thumbnail: string;
  viewerCount: number;
  url: string;
  category?: string;
  creator: Creator;
}

function App() {
  const [rankings, setRankings] = useState<StreamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/v1/streams/rankings')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRankings(data);
        } else {
          console.error('Unexpected response format:', data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch rankings:', err);
        setLoading(false);
      });
  }, []);

  const filteredRankings = useMemo(() => {
    return rankings.filter((item) =>
      item.creator.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [rankings, search]);

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'TWITCH': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'YOUTUBE': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'KICK': return 'text-green-400 border-green-500/30 bg-green-500/10';
      default: return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.15),_transparent_50%)]" />

      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Trophy className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">StreamRank<span className="text-cyan-400">300</span></h1>
              <p className="text-xs font-medium text-slate-400">Real-time Global Leaderboard</p>
            </div>
          </div>

          <div className="relative hidden w-72 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search streamer or game..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-800 bg-slate-900/50 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 py-8 md:px-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 Highlight (if available) */}
            {filteredRankings.length > 0 && !search && (
              <div className="mb-12 grid gap-6 md:grid-cols-3">
                {filteredRankings.slice(0, 3).map((item, index) => (
                  <div key={item.id} className={`relative overflow-hidden rounded-2xl border bg-slate-900/40 p-6 ${index === 0 ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10 md:-mt-4 md:h-[110%]' : 'border-slate-800'}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <span className="text-9xl font-black">{index + 1}</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <img
                          src={item.creator.avatarUrl || `https://ui-avatars.com/api/?name=${item.creator.displayName}&background=random`}
                          alt={item.creator.displayName}
                          className="h-24 w-24 rounded-full border-4 border-slate-950 shadow-xl"
                        />
                        <div className={`absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getPlatformColor(item.platform)}`}>
                          {item.platform}
                        </div>
                      </div>
                      <h3 className="mb-1 text-lg font-bold text-white line-clamp-1">{item.creator.displayName}</h3>
                      <p className="mb-4 text-sm text-slate-400 line-clamp-1">{item.category || 'Just Chatting'}</p>
                      <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-950/50 px-3 py-1.5">
                        <Users className="h-4 w-4 text-cyan-400" />
                        <span className="font-mono font-bold text-cyan-50">{new Intl.NumberFormat().format(item.viewerCount)}</span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                      >
                        Watch Live <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-slate-800 p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 md:grid-cols-[60px_1fr_120px_150px_auto]">
                <div className="text-center">Rank</div>
                <div>Streamer</div>
                <div className="hidden md:block">Category</div>
                <div className="hidden text-right md:block">Viewers</div>
                <div className="invisible">Action</div>
              </div>

              {filteredRankings.slice(search ? 0 : 3).map((item, index) => (
                <div
                  key={item.id}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-slate-800/50 p-4 transition hover:bg-slate-800/40 md:grid-cols-[60px_1fr_120px_150px_auto]"
                >
                  <div className="flex justify-center text-xl font-bold text-slate-500 group-hover:text-cyan-400">
                    {search ? index + 1 : index + 4}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={item.creator.avatarUrl || `https://ui-avatars.com/api/?name=${item.creator.displayName}&background=random`}
                        alt={item.creator.displayName}
                        className="h-10 w-10 rounded-full bg-slate-800 object-cover"
                      />
                      <div className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-slate-900 text-[8px] ${item.platform === 'TWITCH' ? 'bg-purple-500 text-white' :
                        item.platform === 'YOUTUBE' ? 'bg-red-500 text-white' :
                          'bg-green-500 text-black'
                        }`}>
                        {item.platform[0]}
                      </div>
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <div className="truncate font-semibold text-slate-200 group-hover:text-white">{item.creator.displayName}</div>
                      <div className="truncate text-xs text-slate-500 max-w-[200px]">{item.title}</div>
                    </div>
                  </div>

                  <div className="hidden truncate text-sm text-slate-400 md:block">
                    {item.category || 'Unknown'}
                  </div>

                  <div className="hidden text-right font-mono font-medium text-cyan-300 md:block">
                    {new Intl.NumberFormat().format(item.viewerCount)}
                  </div>

                  <div className="flex justify-end">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-cyan-500/20 hover:text-cyan-400"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              ))}

              {filteredRankings.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  <Flame className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p>No streams found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
