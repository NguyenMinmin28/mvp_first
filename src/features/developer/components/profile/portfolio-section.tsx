"use client";

import { ExternalLink } from "lucide-react";

interface PortfolioSectionProps {
  portfolioLinks?: string[];
}

export default function PortfolioSection({ portfolioLinks }: PortfolioSectionProps) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Portfolio Gallery - Bold & Creative Section */}
      <div className="relative group/gallery overflow-hidden">
        {/* Dramatic Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40" />
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s', animationDuration: '8s' }} />
        
        <div className="relative z-10 rounded-3xl border-2 border-white/10 hover:border-white/20 transition-all duration-500 shadow-2xl p-6 lg:p-10">
          {/* Bold Header */}
          <div className="flex items-center justify-between mb-8 lg:mb-10">
            <div className="flex items-center gap-4">
              <div className="relative group/icon">
                <div className="absolute inset-0 bg-white rounded-2xl blur-xl opacity-30 group-hover/icon:opacity-50 transition-opacity duration-500" />
                <div className="relative w-14 h-14 lg:w-16 lg:h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 group-hover/icon:rotate-12 transition-all duration-500">
                  <svg className="w-7 h-7 lg:w-8 lg:h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-1">Portfolio Gallery</h2>
                <p className="text-sm lg:text-base text-gray-400 font-medium">Showcase of creative excellence</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
                <span className="text-white font-black text-sm">5 Projects</span>
              </div>
            </div>
          </div>

          {/* Bold Gallery Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
            {[
              { url: 'https://reallygooddesigns.com/wp-content/uploads/2024/11/creative-website-designs.jpg', delay: 0 },
              { url: 'https://53.fs1.hubspotusercontent-na1.net/hubfs/53/website-design-16-20241121-8236349.webp', delay: 100 },
              { url: 'https://static.vecteezy.com/system/resources/previews/016/547/646/non_2x/creative-website-template-designs-illustration-concepts-of-web-page-design-for-website-and-mobile-website-vector.jpg', delay: 200 },
              { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnXfZO3obE15TS3kuUeF7pv6XkNSOVJeihyQ&s', delay: 300 },
              { url: 'https://img.freepik.com/free-vector/cartoon-web-design-landing-page_52683-70880.jpg?semt=ais_hybrid&w=740&q=80', delay: 400 }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="relative group/item animate-fade-in-up"
                style={{ animationDelay: `${item.delay}ms` }}
              >
                {/* Dramatic Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-2xl blur-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 animate-pulse" />
                
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-white/20 group-hover/item:border-white shadow-xl group-hover/item:shadow-2xl transition-all duration-500 cursor-pointer bg-black/50">
                  {/* Diagonal Shine */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/40 to-white/0 -translate-x-full -translate-y-full group-hover/item:translate-x-full group-hover/item:translate-y-full transition-transform duration-1000 z-10" />
                  
                  {/* Image */}
                  <img 
                    src={item.url} 
                    alt={`Portfolio ${idx + 1}`}
                    className="w-full h-full object-cover group-hover/item:scale-125 group-hover/item:rotate-3 transition-all duration-700 filter grayscale-0 group-hover/item:grayscale-0"
                  />
                  
                  {/* Bold Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center z-20 gap-3">
                    <div className="transform translate-y-4 group-hover/item:translate-y-0 transition-transform duration-500">
                      <svg className="w-10 h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                    <div className="transform translate-y-4 group-hover/item:translate-y-0 transition-transform duration-500 delay-75">
                      <span className="text-white font-black text-sm lg:text-base uppercase tracking-wider">View Project</span>
                    </div>
                  </div>
                  
                  {/* Floating Number Badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full flex items-center justify-center shadow-2xl z-30 group-hover/item:scale-125 group-hover/item:-rotate-12 transition-all duration-500">
                    <span className="text-base lg:text-lg font-black text-black">{idx + 1}</span>
                  </div>
                  
                  {/* Corner Accent */}
                  <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[30px] border-l-white border-b-[30px] border-b-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 z-30" />
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="mt-8 lg:mt-10 flex justify-center">
            <button className="group/btn relative overflow-hidden px-8 py-4 lg:px-10 lg:py-5 bg-white hover:bg-gray-100 rounded-2xl shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
              <div className="relative flex items-center gap-3">
                <span className="text-lg lg:text-xl font-black text-black uppercase tracking-wider">View All Projects</span>
                <svg className="w-6 h-6 text-black group-hover/btn:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Links Section */}
      {portfolioLinks && portfolioLinks.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
          <h4 className="text-lg font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            External Portfolio Links
          </h4>
          <div className="space-y-3">
            {portfolioLinks.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 hover:border-black rounded-xl hover:shadow-lg transition-all duration-200"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 will-change-transform">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-900 font-bold text-sm flex-1 break-all group-hover:text-black transition-colors duration-200">
                  {url}
                </span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
