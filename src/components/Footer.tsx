import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col md:flex-row md:justify-between items-center md:items-start gap-8">
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center mb-4">
              <img src="/logo.svg" alt="IDSphere" className="h-7 w-auto" />
            </div>
            <p className="text-slate-600 text-sm mb-1">Digital identity management made simple.</p>
            <p className="text-slate-500 text-xs font-medium">Powered by Metadox Digital</p>
          </div>

          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <p className="text-slate-900 font-medium text-sm mb-4">Support</p>
            <a href="mailto:metadoxdigital@gmail.com" className="text-slate-600 hover:text-blue-600 text-sm mb-6 transition-colors">
              metadoxdigital@gmail.com
            </a>
            
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link to="/privacy" className="text-slate-600 hover:text-slate-900 transition-colors">Privacy Policy</Link>
              <span className="text-slate-300">|</span>
              <Link to="/terms" className="text-slate-600 hover:text-slate-900 transition-colors">Terms and Conditions</Link>
            </div>
          </div>

        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-xs">
            &copy; 2026 IDSphere. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
