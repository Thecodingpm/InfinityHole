'use client';

import { useState } from 'react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const downloadOptions = [
    {
      id: 'android',
      title: 'Android App',
      subtitle: 'Download for Android',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.6818 12 7.6818s-3.5902.5621-5.1367 1.6649L4.841 5.8437a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
        </svg>
      ),
      gradient: 'from-green-400 to-emerald-600',
      hoverGradient: 'from-green-300 to-emerald-500',
      description: 'Get the full experience on your Android device'
    },
    {
      id: 'mac',
      title: 'Mac App',
      subtitle: 'Download for macOS',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      gradient: 'from-gray-400 to-gray-600',
      hoverGradient: 'from-gray-300 to-gray-500',
      description: 'Native macOS application for power users'
    },
    {
      id: 'website',
      title: 'Use Website',
      subtitle: 'Open in Browser',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      ),
      gradient: 'from-blue-400 to-cyan-600',
      hoverGradient: 'from-blue-300 to-cyan-500',
      description: 'Access directly from your web browser'
    }
  ];

  const handleDownload = (option: string) => {
    if (option === 'website') {
      onEnterApp();
    } else if (option === 'android') {
      // Download Android APK
      window.open('/downloads/infinity-hole.apk', '_blank');
    } else if (option === 'mac') {
      // Download Mac DMG
      window.open('/downloads/infinity-hole.dmg', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl shadow-yellow-500/25">
              <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-wider mb-6 text-white">
            INFINITY HOLE
          </h1>
          
          <div className="w-32 md:w-40 h-1 bg-white/20 mx-auto rounded-full mb-8"></div>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-4 font-light max-w-3xl mx-auto leading-relaxed">
            The ultimate video downloader that works everywhere
          </p>
          
          <p className="text-lg text-slate-400 mb-12 font-light max-w-2xl mx-auto">
            Download videos from any platform with our powerful, cross-platform solution
          </p>
        </div>

        {/* Download Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {downloadOptions.map((option) => (
            <div
              key={option.id}
              className="group relative"
              onMouseEnter={() => setIsHovered(option.id)}
              onMouseLeave={() => setIsHovered(null)}
            >
              <div
                className={`
                  relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm
                  transition-all duration-500 cursor-pointer
                  hover:scale-105 hover:bg-white/10 hover:border-white/20
                  ${isHovered === option.id ? 'shadow-2xl shadow-purple-500/25' : 'shadow-lg'}
                `}
                onClick={() => handleDownload(option.id)}
              >
                {/* Background Gradient */}
                <div
                  className={`
                    absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10
                    bg-gradient-to-br transition-opacity duration-500
                    ${option.gradient}
                  `}
                ></div>
                
                {/* Icon */}
                <div
                  className={`
                    inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6
                    bg-gradient-to-br transition-all duration-500
                    ${isHovered === option.id ? option.hoverGradient : option.gradient}
                    shadow-lg
                  `}
                >
                  <div className="text-white">
                    {option.icon}
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {option.title}
                </h3>
                
                <p className="text-slate-400 mb-4 font-medium">
                  {option.subtitle}
                </p>
                
                <p className="text-sm text-slate-500 leading-relaxed">
                  {option.description}
                </p>
                
                {/* Download Button */}
                <div className="mt-6">
                  <div
                    className={`
                      inline-flex items-center px-6 py-3 rounded-full font-semibold
                      bg-gradient-to-r transition-all duration-300
                      ${option.gradient}
                      hover:shadow-lg hover:scale-105
                      text-white
                    `}
                  >
                    <span className="mr-2">
                      {option.id === 'website' ? 'Open' : 'Download'}
                    </span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="flex items-center justify-center space-x-3 text-slate-400">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium">Unlimited Downloads</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-slate-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-sm font-medium">HD Quality</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-slate-400">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span className="text-sm font-medium">Fast & Secure</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            Choose your platform and start downloading videos instantly
          </p>
        </div>
      </div>
    </div>
  );
}
