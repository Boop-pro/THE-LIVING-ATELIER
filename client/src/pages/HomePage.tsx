import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Painting } from '../types';
import { Sparkles, ArrowRight, Paintbrush, Layers, Flame, CheckCircle, Star } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPaintings()
      .then((res) => {
        if (res.success) {
          setPaintings(res.paintings.slice(0, 3)); // 3 featured
        }
      })
      .catch((err) => console.error('Error fetching featured paintings:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-24 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-atelier-lavender border-b-4 border-atelier-ink pt-12 pb-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        
        {/* Decorative Floating Blobs / Shapes */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-atelier-chartreuse/40 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-atelier-tomato/20 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Headline Column */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-atelier-chartreuse text-atelier-ink font-display font-bold text-xs uppercase tracking-widest border-2 border-atelier-ink shadow-brutal">
                <Sparkles className="w-4 h-4" />
                Original Contemporary Indian Atelier
              </div>

              <h1 className="font-display font-black text-5xl sm:text-6xl xl:text-7xl tracking-tighter text-atelier-ink leading-[0.95]">
                ART ISN'T MEANT <br />
                <span className="relative inline-block text-white bg-atelier-ink px-3 py-1 my-1 rotate-[-1deg] shadow-brutal">
                  TO BLEND IN.
                </span>
              </h1>

              <p className="font-body text-lg sm:text-xl text-atelier-ink/90 max-w-xl font-medium leading-relaxed">
                Step away from sterile prints and mass-produced beige. Discover authentic folk paintings, book master wall murals, and commission bespoke kiln pottery handcrafted in Hyderabad.
              </p>

              {/* Call to Actions */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link to="/gallery" className="btn-primary text-base px-8 py-4 shadow-brutal-lg">
                  Explore the Gallery
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link to="/wall-art" className="btn-accent text-base px-8 py-4 shadow-brutal-lg">
                  Book a Wall
                  <Paintbrush className="w-5 h-5 ml-2" />
                </Link>
              </div>

              {/* Value Props Row */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t-2 border-atelier-ink/20 max-w-lg">
                <div>
                  <span className="font-display font-black text-2xl text-atelier-ink block">100%</span>
                  <span className="text-xs font-bold text-atelier-ink/70 uppercase">One-Of-A-Kind</span>
                </div>
                <div>
                  <span className="font-display font-black text-2xl text-atelier-ink block">₹150</span>
                  <span className="text-xs font-bold text-atelier-ink/70 uppercase">Per Sq. Ft Murals</span>
                </div>
                <div>
                  <span className="font-display font-black text-2xl text-atelier-ink block">6 Glazes</span>
                  <span className="text-xs font-bold text-atelier-ink/70 uppercase">Wood-Fired Clay</span>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Artwork Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              {/* Rotating Circular Atelier Stamp */}
              <div className="absolute -top-6 -left-6 z-20 w-24 h-24 rounded-full bg-atelier-chartreuse border-2 border-atelier-ink shadow-brutal flex items-center justify-center text-center p-2 animate-[spin_16s_linear_infinite]">
                <span className="font-display font-black text-[9px] uppercase tracking-wider text-atelier-ink block">
                  ★ THE LIVING ATELIER ★ HYDERABAD ★
                </span>
              </div>

              {/* Framed Feature Artwork */}
              <div className="relative bg-white p-4 rounded-3xl border-4 border-atelier-ink shadow-brutal-xl rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-atelier-ink bg-atelier-cream">
                  <img
                    src="/images/p-001.jpg"
                    alt="Madhubani Peacock Garden"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-atelier-chartreuse text-atelier-ink font-display font-bold text-xs uppercase px-3 py-1 rounded-full border-2 border-atelier-ink shadow-brutal">
                    Available Now
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-black text-lg text-atelier-ink">
                      Madhubani Peacock Garden
                    </h3>
                    <p className="text-xs font-medium text-atelier-muted">
                      Meera Kumari • Natural Pigments on Paper
                    </p>
                  </div>
                  <span className="font-display font-black text-xl text-atelier-ink bg-atelier-cream px-3 py-1 rounded-xl border-2 border-atelier-ink">
                    ₹6,500
                  </span>
                </div>
              </div>

              {/* Decorative Red Pill Tag */}
              <div className="absolute -bottom-5 right-6 z-20 bg-atelier-tomato text-white font-display font-bold text-xs uppercase px-4 py-2 rounded-full border-2 border-atelier-ink shadow-brutal rotate-2">
                12 Masterworks In Seed Collection
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* THREE CORE SERVICES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="art-badge bg-atelier-chartreuse text-atelier-ink">
            What We Craft
          </span>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-atelier-ink tracking-tight">
            THREE WAYS TO BRING ART HOME
          </h2>
          <p className="text-base text-atelier-muted font-body">
            From framed collector originals to towering architectural murals and hand-thrown studio pottery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Service 1: Original Paintings */}
          <div className="art-card group p-8 flex flex-col justify-between bg-white border-2 border-atelier-ink">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-atelier-lavender border-2 border-atelier-ink flex items-center justify-center shadow-brutal group-hover:-rotate-6 transition-transform">
                <Paintbrush className="w-7 h-7 text-atelier-ink" />
              </div>
              <h3 className="font-display font-black text-2xl text-atelier-ink">
                Original Paintings
              </h3>
              <p className="text-sm text-atelier-muted font-body leading-relaxed">
                Discover one-of-a-kind artworks by master folk artists. Madhubani, Warli, Tanjore, Pattachitra, Kalamkari, Gond, and Cheriyal panels with permanent authenticity provenance.
              </p>
              <ul className="space-y-2 pt-2 text-xs font-bold text-atelier-ink">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-atelier-chartreuse fill-atelier-ink" />
                  Each painting is strictly one of a kind
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-atelier-chartreuse fill-atelier-ink" />
                  Real mineral &amp; vegetable pigments
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <Link to="/gallery" className="btn-outline w-full text-center">
                Browse Collection
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>

          {/* Service 2: Wall Murals */}
          <div className="art-card group p-8 flex flex-col justify-between bg-atelier-chartreuse/20 border-2 border-atelier-ink relative">
            <div className="absolute top-4 right-4 bg-atelier-tomato text-white text-[10px] font-display font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-atelier-ink">
              ₹150 / Sq.Ft
            </div>
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-atelier-chartreuse border-2 border-atelier-ink flex items-center justify-center shadow-brutal group-hover:rotate-6 transition-transform">
                <Layers className="w-7 h-7 text-atelier-ink" />
              </div>
              <h3 className="font-display font-black text-2xl text-atelier-ink">
                Wall Art &amp; Murals
              </h3>
              <p className="text-sm text-atelier-muted font-body leading-relaxed">
                Turn ordinary walls into expressive artistic statements. Our resident muralists paint bespoke custom compositions directly in your living room, studio, cafe, or workplace.
              </p>
              <ul className="space-y-2 pt-2 text-xs font-bold text-atelier-ink">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-atelier-tomato fill-atelier-ink" />
                  10 to 500 sq.ft customizable sizing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-atelier-tomato fill-atelier-ink" />
                  Guaranteed single active client per date
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <Link to="/wall-art" className="btn-accent w-full text-center">
                Book a Wall Mural
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>

          {/* Service 3: Custom Pottery */}
          <div className="art-card group p-8 flex flex-col justify-between bg-white border-2 border-atelier-ink">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-atelier-tomato/20 border-2 border-atelier-ink flex items-center justify-center shadow-brutal group-hover:-rotate-6 transition-transform">
                <Flame className="w-7 h-7 text-atelier-tomato" />
              </div>
              <h3 className="font-display font-black text-2xl text-atelier-ink">
                Custom Pottery
              </h3>
              <p className="text-sm text-atelier-muted font-body leading-relaxed">
                Handcrafted pieces thrown around your ideas. Choose traditional kulhads, surahis, matkas, diya sets, and planters with natural mineral glazes in Kumkum, Haldi, Mehendi, or Indigo.
              </p>
              <ul className="space-y-2 pt-2 text-xs font-bold text-atelier-ink">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-atelier-chartreuse fill-atelier-ink" />
                  Kiln-fired terracotta &amp; stoneware
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-atelier-chartreuse fill-atelier-ink" />
                  Quantities from 1 to 12 pieces
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <Link to="/pottery" className="btn-lavender w-full text-center">
                Commission Pottery
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURED PAINTINGS PREVIEW */}
      <section className="bg-atelier-blush-soft border-y-2 border-atelier-ink py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <span className="art-badge bg-atelier-lavender text-atelier-ink">
                Gallery Preview
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-atelier-ink mt-2">
                FEATURED ARTWORKS
              </h2>
            </div>
            <Link to="/gallery" className="btn-outline">
              View All 12 Works
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {paintings.map((p) => (
              <div key={p.id} className="art-card group flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[4/3] bg-atelier-ink/5 overflow-hidden border-b-2 border-atelier-ink">
                    <img
                      src={`/${p.imageUrl}`}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute top-3 right-3">
                      {p.status === 'available' ? (
                        <span className="art-badge bg-atelier-chartreuse text-atelier-ink">
                          Available
                        </span>
                      ) : (
                        <span className="art-badge bg-atelier-tomato text-white">
                          Sold
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-2">
                    <p className="text-xs font-bold text-atelier-muted uppercase tracking-wider">
                      {p.artist}
                    </p>
                    <h3 className="font-display font-black text-xl text-atelier-ink line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-atelier-muted line-clamp-2 font-body">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between border-t border-atelier-border/60 mt-4">
                  <span className="font-display font-black text-xl text-atelier-ink">
                    ₹{p.price.toLocaleString('en-IN')}
                  </span>
                  <Link
                    to="/gallery"
                    className={p.status === 'available' ? 'btn-primary text-xs py-2 px-4' : 'btn-outline text-xs py-2 px-4 opacity-50 pointer-events-none'}
                  >
                    {p.status === 'available' ? 'Purchase' : 'Collected'}
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* THE ATELIER MANIFESTO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-atelier-ink text-white rounded-3xl p-8 sm:p-14 border-4 border-atelier-lavender shadow-brutal-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="inline-block px-4 py-1 rounded-full bg-atelier-tomato text-white font-display font-bold text-xs uppercase tracking-widest border border-white">
              The Atelier Manifesto
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              WE REJECT MASS PRINTS AND SOULESS ALGORITHMIC DECOR.
            </h2>
            <p className="text-atelier-cream/80 text-base sm:text-lg font-body leading-relaxed">
              Every painting in our atelier is hand-executed with organic tempera and natural binders on handmade paper or woven tussar. Every wall mural is painted in live collaboration with the space owner. Every pottery piece spends 72 hours in our wood-fired kiln.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link to="/gallery" className="btn-primary">
                Explore The Collection
              </Link>
              <Link to="/pottery" className="btn-outline bg-transparent text-white border-white hover:bg-white/10">
                Commission a Piece
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
