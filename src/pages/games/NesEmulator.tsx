import React, { useState, useEffect } from 'react';
import { nesGames, NesGame } from '../../data/nesGames';
import { NesEmulator } from '../../components/NesEmulator';
import { Search, Heart, Clock, ArrowLeft, Gamepad, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NesEmulatorPage() {
  const { t } = useTranslation();
  const [selectedGame, setSelectedGame] = useState<NesGame | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('nes_favorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    
    const savedHistory = localStorage.getItem('nes_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const toggleFavorite = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    let newFavorites;
    if (favorites.includes(gameId)) {
      newFavorites = favorites.filter(id => id !== gameId);
    } else {
      newFavorites = [...favorites, gameId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('nes_favorites', JSON.stringify(newFavorites));
  };

  const handleGameSelect = (game: NesGame) => {
    setSelectedGame(game);
    // Update history
    const newHistory = [game.id, ...history.filter(id => id !== game.id)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('nes_history', JSON.stringify(newHistory));
  };

  const filteredGames = nesGames.filter(game => {
    const matchesFilter = filter === 'All' 
      || (filter === 'Favorites' && favorites.includes(game.id))
      || (filter === 'History' && history.includes(game.id))
      || game.genre === filter;
    
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const genres = ['All', 'Action', 'Adventure', 'RPG', 'Puzzle', 'Strategy', 'Sports', 'Racing', 'Favorites', 'History'];

  if (selectedGame) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-950 text-white">
        <button 
          onClick={() => setSelectedGame(null)}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Library
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <NesEmulator 
              romUrl={selectedGame.romUrl} 
              core={selectedGame.core} 
            />
            <div className="mt-6 p-6 bg-gray-900 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold">{selectedGame.title}</h1>
                <button 
                  onClick={(e) => toggleFavorite(e, selectedGame.id)}
                  className={`p-2 rounded-full ${favorites.includes(selectedGame.id) ? 'text-red-500 bg-red-500/10' : 'text-gray-400 bg-gray-800'}`}
                >
                  <Heart size={24} fill={favorites.includes(selectedGame.id) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full text-sm border border-blue-800">
                  {selectedGame.genre}
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed">{selectedGame.description}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900 p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Gamepad size={20} />
                Similar Games
              </h2>
              <div className="space-y-4">
                {nesGames
                  .filter(g => g.genre === selectedGame.genre && g.id !== selectedGame.id)
                  .slice(0, 3)
                  .map(game => (
                    <div 
                      key={game.id}
                      onClick={() => handleGameSelect(game)}
                      className="flex gap-4 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors group"
                    >
                      <img 
                        src={game.coverUrl} 
                        alt={game.title} 
                        className="w-16 h-16 object-cover rounded shadow-md group-hover:scale-105 transition-transform"
                      />
                      <div>
                        <h3 className="font-semibold text-sm">{game.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{game.genre}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-950 text-white">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            NES Arcade
          </h1>
          <p className="text-gray-400 mt-1">Classic 8-bit Games Collection</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="lg:w-64 space-y-2 flex-shrink-0">
          <div className="bg-gray-900 p-4 rounded-xl sticky top-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-300">
              <Filter size={18} />
              Categories
            </h2>
            <div className="space-y-1">
              {genres.map(genre => (
                <button
                  key={genre}
                  onClick={() => setFilter(genre)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    filter === genre 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {genre === 'Favorites' && <Heart size={16} />}
                  {genre === 'History' && <Clock size={16} />}
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Game Grid */}
        <div className="flex-1">
          {filteredGames.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-xl">No games found</p>
              <p className="text-sm mt-2">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGames.map(game => (
                <div 
                  key={game.id}
                  className="group bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-800 hover:border-blue-500/50 cursor-pointer relative"
                  onClick={() => handleGameSelect(game)}
                >
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <img 
                      src={game.coverUrl} 
                      alt={game.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <span className="inline-block px-2 py-1 bg-blue-600 text-xs rounded-full self-start mb-2">
                        Play Now
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {game.title}
                      </h3>
                      <button 
                        onClick={(e) => toggleFavorite(e, game.id)}
                        className={`transition-colors ${favorites.includes(game.id) ? 'text-red-500' : 'text-gray-600 hover:text-red-400'}`}
                      >
                        <Heart size={18} fill={favorites.includes(game.id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">{game.genre}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
