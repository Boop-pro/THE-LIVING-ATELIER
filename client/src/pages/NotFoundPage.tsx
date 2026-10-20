import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="bg-white rounded-3xl border-4 border-atelier-ink shadow-brutal-xl p-12 max-w-md w-full space-y-6">
        <div className="w-16 h-16 rounded-full bg-atelier-chartreuse border-2 border-atelier-ink shadow-brutal flex items-center justify-center mx-auto">
          <Palette className="w-8 h-8 text-atelier-ink" />
        </div>
        <div className="space-y-2">
          <span className="art-badge bg-atelier-tomato text-white">404 Canvas Not Found</span>
          <h1 className="font-display font-black text-3xl text-atelier-ink">
            OFF THE CANVAS
          </h1>
          <p className="text-sm text-atelier-muted font-body">
            The atelier gallery room you are looking for has been moved or doesn't exist.
          </p>
        </div>
        <Link to="/" className="btn-primary w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Atelier Home
        </Link>
      </div>
    </div>
  );
};
