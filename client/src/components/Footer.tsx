import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, Heart, MapPin, Mail, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-atelier-ink text-atelier-cream border-t-4 border-atelier-lavender mt-24">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Studio Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-atelier-chartreuse border-2 border-atelier-cream flex items-center justify-center">
                <Palette className="w-5 h-5 text-atelier-ink" />
              </div>
              <span className="font-display font-black text-2xl tracking-tight text-white">
                THE LIVING ATELIER
              </span>
            </div>
            <p className="text-sm text-atelier-cream/80 max-w-md leading-relaxed font-body">
              An independent contemporary studio dedicated to traditional craftsmanship and bold, modern artistic expression. Bringing original folk-art paintings, custom architectural wall murals, and studio pottery into everyday spaces.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-atelier-blush border border-white" title="Blush Pink #FFE8E5" />
              <span className="w-6 h-6 rounded-full bg-atelier-lavender border border-white" title="Lavender #B9A2E8" />
              <span className="w-6 h-6 rounded-full bg-atelier-chartreuse border border-white" title="Chartreuse #D7FF43" />
              <span className="w-6 h-6 rounded-full bg-atelier-tomato border border-white" title="Tomato Red #F34F40" />
              <span className="w-6 h-6 rounded-full bg-atelier-cream border border-white" title="Cream #FAF8F3" />
              <span className="w-6 h-6 rounded-full bg-atelier-ink border border-white" title="Ink Black #24211F" />
              <span className="text-xs text-atelier-cream/60 ml-2 font-mono">Curated Atelier Palette</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-atelier-chartreuse">
              Atelier Collections
            </h4>
            <ul className="space-y-2 text-sm font-body">
              <li>
                <Link to="/gallery" className="hover:text-atelier-lavender transition-colors">
                  Original Paintings
                </Link>
              </li>
              <li>
                <Link to="/wall-art" className="hover:text-atelier-lavender transition-colors">
                  Wall Murals &amp; Frescoes
                </Link>
              </li>
              <li>
                <Link to="/pottery" className="hover:text-atelier-lavender transition-colors">
                  Handcrafted Pottery
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-atelier-lavender transition-colors">
                  Client Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-atelier-tomato transition-colors">
                  Studio Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-atelier-tomato">
              Studio &amp; Kiln
            </h4>
            <ul className="space-y-2 text-xs text-atelier-cream/80 font-body">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-atelier-lavender flex-shrink-0 mt-0.5" />
                <span>Road No. 12, Banjara Hills, Hyderabad, Telangana 500034</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-atelier-chartreuse flex-shrink-0" />
                <span>studio@artstudio.in</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-atelier-tomato flex-shrink-0 mt-0.5" />
                <span>Tuesday – Sunday<br />10:00 AM – 7:30 PM IST</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Credits */}
        <div className="mt-12 pt-8 border-t border-atelier-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-atelier-cream/60">
          <p>© 2026 The Living Atelier. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed &amp; Hand-Coded with
            <Heart className="w-3.5 h-3.5 text-atelier-tomato fill-atelier-tomato" />
            for Art Lovers Everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
};
