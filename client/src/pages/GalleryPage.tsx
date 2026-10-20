import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Painting } from '../types';
import { PaintingCardSkeleton } from '../components/LoadingSkeleton';
import { Search, Sparkles, ShoppingBag, Eye, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'sold'>('all');
  const [selectedPainting, setSelectedPainting] = useState<Painting | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const { isAuthenticated, user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const fetchPaintings = () => {
    setLoading(true);
    setError(null);
    api.getPaintings()
      .then((res) => {
        if (res.success) {
          setPaintings(res.paintings);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load painting gallery');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPaintings();
  }, []);

  const handlePurchase = async (painting: Painting) => {
    if (!isAuthenticated) {
      toastError('Sign In Required', 'Please log in to acquire original paintings.');
      navigate('/login');
      return;
    }

    if (painting.status === 'sold') {
      toastError('Unavailable', 'This one-of-a-kind artwork has already been collected.');
      return;
    }

    setPurchasingId(painting.id);
    try {
      const res = await api.purchasePainting(painting.id);
      success('Artwork Acquired!', res.message || `You are now the collector of "${painting.title}".`);
      
      // Update local state to reflect sold status
      setPaintings((prev) =>
        prev.map((p) => (p.id === painting.id ? { ...p, status: 'sold' } : p))
      );
      if (selectedPainting && selectedPainting.id === painting.id) {
        setSelectedPainting({ ...selectedPainting, status: 'sold' });
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 409) {
        toastError('Purchase Conflict', 'This painting was just collected by another patron.');
        // Refresh gallery
        fetchPaintings();
      } else {
        toastError('Purchase Failed', err.message || 'Could not complete purchase transaction.');
      }
    } finally {
      setPurchasingId(null);
    }
  };

  const filteredPaintings = paintings.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header Banner */}
      <div className="bg-atelier-lavender border-2 border-atelier-ink rounded-3xl p-8 sm:p-12 shadow-brutal flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <span className="art-badge bg-atelier-chartreuse text-atelier-ink">
            Permanent Atelier Catalog
          </span>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-atelier-ink tracking-tight">
            ORIGINAL FOLK PAINTINGS
          </h1>
          <p className="text-atelier-ink/80 font-body text-base leading-relaxed">
            Every work in this collection is an authentic single-edition original created with organic mineral pigments, gold leaf, and natural vegetable dyes on handmade surfaces.
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-atelier-ink shadow-brutal flex items-center gap-4">
          <div className="text-center px-3 border-r-2 border-atelier-border">
            <span className="font-display font-black text-2xl text-atelier-ink block">
              {paintings.filter((p) => p.status === 'available').length}
            </span>
            <span className="text-[10px] font-bold text-atelier-muted uppercase">Available</span>
          </div>
          <div className="text-center px-3">
            <span className="font-display font-black text-2xl text-atelier-tomato block">
              {paintings.filter((p) => p.status === 'sold').length}
            </span>
            <span className="text-[10px] font-bold text-atelier-muted uppercase">Collected</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-muted" />
          <input
            type="text"
            placeholder="Search by title, artist, or style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white border-2 border-atelier-ink shadow-brutal focus:outline-none focus:ring-2 focus:ring-atelier-chartreuse text-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-atelier-muted hover:text-atelier-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 p-1 bg-white border-2 border-atelier-ink rounded-full shadow-brutal">
          {(['all', 'available', 'sold'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-full font-display font-bold text-xs uppercase tracking-wider transition-all ${
                statusFilter === status
                  ? status === 'available'
                    ? 'bg-atelier-chartreuse text-atelier-ink shadow-sm'
                    : status === 'sold'
                    ? 'bg-atelier-tomato text-white shadow-sm'
                    : 'bg-atelier-ink text-white shadow-sm'
                  : 'text-atelier-muted hover:text-atelier-ink'
              }`}
            >
              {status === 'all' ? 'All Artworks' : status === 'available' ? 'Available' : 'Collected (Sold)'}
            </button>
          ))}
        </div>

      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <PaintingCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border-2 border-atelier-ink rounded-2xl p-12 text-center max-w-lg mx-auto shadow-brutal space-y-4">
          <AlertCircle className="w-12 h-12 text-atelier-tomato mx-auto" />
          <h3 className="font-display font-bold text-xl">Unable to Load Paintings</h3>
          <p className="text-sm text-atelier-muted">{error}</p>
          <button onClick={fetchPaintings} className="btn-primary">
            Retry Connection
          </button>
        </div>
      ) : filteredPaintings.length === 0 ? (
        <div className="bg-white border-2 border-atelier-ink rounded-2xl p-12 text-center max-w-lg mx-auto shadow-brutal space-y-4">
          <Info className="w-12 h-12 text-atelier-lavender mx-auto" />
          <h3 className="font-display font-bold text-xl">No Artworks Found</h3>
          <p className="text-sm text-atelier-muted">
            No paintings match your current search query or filter selection.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="btn-outline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPaintings.map((painting) => {
            const isSold = painting.status === 'sold';
            const isBusy = purchasingId === painting.id;

            return (
              <motion.div
                key={painting.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`art-card group flex flex-col justify-between ${
                  isSold ? 'opacity-85 grayscale-[0.2]' : ''
                }`}
              >
                <div>
                  {/* Artwork Image Container */}
                  <div
                    onClick={() => setSelectedPainting(painting)}
                    className="relative aspect-[4/3] bg-atelier-ink/5 overflow-hidden border-b-2 border-atelier-ink cursor-pointer"
                  >
                    <img
                      src={`/${painting.imageUrl}`}
                      alt={painting.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Status Pill Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      {isSold ? (
                        <span className="art-badge bg-atelier-tomato text-white">
                          Sold
                        </span>
                      ) : (
                        <span className="art-badge bg-atelier-chartreuse text-atelier-ink">
                          Available
                        </span>
                      )}
                    </div>

                    {/* Hover Inspect Overlay */}
                    <div className="absolute inset-0 bg-atelier-ink/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white font-display font-bold text-xs uppercase tracking-wider text-atelier-ink border-2 border-atelier-ink shadow-brutal">
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Details
                      </span>
                    </div>
                  </div>

                  {/* Artwork Meta */}
                  <div className="p-6 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-atelier-muted">
                      <span>{painting.artist}</span>
                      <span className="font-mono text-[10px] text-atelier-ink/60">{painting.id}</span>
                    </div>

                    <h3
                      onClick={() => setSelectedPainting(painting)}
                      className="font-display font-black text-xl text-atelier-ink line-clamp-1 hover:text-atelier-lavender-dark cursor-pointer transition-colors"
                      title={painting.title}
                    >
                      {painting.title}
                    </h3>

                    <p className="text-xs text-atelier-muted line-clamp-3 font-body leading-relaxed">
                      {painting.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Card Bar */}
                <div className="p-6 pt-0 flex items-center justify-between border-t border-atelier-border/60 mt-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-atelier-muted block">Collector Price</span>
                    <span className="font-display font-black text-2xl text-atelier-ink">
                      ₹{painting.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    {isSold ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-display font-bold uppercase tracking-wider bg-atelier-ink/10 text-atelier-muted border border-atelier-border cursor-not-allowed">
                        Collected
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePurchase(painting)}
                        disabled={isBusy}
                        className="btn-primary text-xs py-2.5 px-5 shadow-brutal"
                      >
                        {isBusy ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border-2 border-atelier-ink border-t-transparent animate-spin" />
                            Acquiring...
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Acquire Artwork
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedPainting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-atelier-ink/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border-4 border-atelier-ink shadow-brutal-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="relative">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedPainting(null)}
                  className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white border-2 border-atelier-ink shadow-brutal hover:bg-atelier-tomato hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Artwork High-Res Header Image */}
                <div className="relative aspect-[16/10] bg-atelier-cream overflow-hidden border-b-2 border-atelier-ink">
                  <img
                    src={`/${selectedPainting.imageUrl}`}
                    alt={selectedPainting.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-4 left-4">
                    {selectedPainting.status === 'sold' ? (
                      <span className="art-badge bg-atelier-tomato text-white">
                        Sold to Collector
                      </span>
                    ) : (
                      <span className="art-badge bg-atelier-chartreuse text-atelier-ink">
                        Available in Atelier
                      </span>
                    )}
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-atelier-muted">
                      Master Artist: {selectedPainting.artist}
                    </span>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-atelier-ink mt-1">
                      {selectedPainting.title}
                    </h2>
                  </div>

                  <div className="bg-atelier-cream p-5 rounded-2xl border-2 border-atelier-ink space-y-2">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-atelier-ink">
                      Provenance &amp; Specifications
                    </h4>
                    <p className="text-sm text-atelier-ink font-body leading-relaxed">
                      {selectedPainting.description}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-atelier-ink/10">
                    <div>
                      <span className="text-xs font-bold uppercase text-atelier-muted block">Direct Studio Price</span>
                      <span className="font-display font-black text-3xl text-atelier-ink">
                        ₹{selectedPainting.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => setSelectedPainting(null)}
                        className="btn-outline flex-1 sm:flex-initial"
                      >
                        Close
                      </button>
                      {selectedPainting.status === 'available' && (
                        <button
                          onClick={() => handlePurchase(selectedPainting)}
                          disabled={purchasingId === selectedPainting.id}
                          className="btn-primary flex-1 sm:flex-initial"
                        >
                          <ShoppingBag className="w-4 h-4 mr-1.5" />
                          Confirm Acquisition
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
