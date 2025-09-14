'use client';

import { useState } from 'react';

interface BlackHoleProps {
  onClick: () => void;
}

export function BlackHole({ onClick }: BlackHoleProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div className="relative group">
      {/* Logo Container */}
      <div
        className={`
          relative w-64 h-64 md:w-72 md:h-72 cursor-pointer transition-all duration-500
          hover:scale-110 hover:rotate-12
          active:scale-95
          ${isPressed ? 'scale-95' : ''}
        `}
        onClick={onClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
      >
        {/* Custom Infinity Hole Logo */}
        <div className="relative w-full h-full">
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 blur-2xl scale-150 group-hover:scale-[1.8] transition-all duration-1000 animate-pulse"></div>
          
          {/* Main black hole */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, 
                  #1a1a1a 0%, 
                  #0d0d0d 30%, 
                  #000000 60%, 
                  #000000 100%
                )
              `,
              boxShadow: `
                0 0 60px rgba(0, 0, 0, 0.8),
                inset 0 0 40px rgba(0, 0, 0, 0.9),
                0 0 120px rgba(139, 69, 19, 0.3)
              `
            }}
          >
            {/* Accretion disk rings */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {/* Outer ring */}
              <div 
                className="absolute inset-0 rounded-full border-2 border-orange-500/30 animate-spin"
                style={{ animationDuration: '8s' }}
              ></div>
              {/* Middle ring */}
              <div 
                className="absolute inset-4 rounded-full border border-yellow-400/40 animate-spin"
                style={{ animationDuration: '12s', animationDirection: 'reverse' }}
              ></div>
              {/* Inner ring */}
              <div 
                className="absolute inset-8 rounded-full border border-red-500/50 animate-spin"
                style={{ animationDuration: '6s' }}
              ></div>
            </div>

            {/* Event horizon */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
              style={{
                background: `
                  radial-gradient(circle, 
                    #2a2a2a 0%, 
                    #1a1a1a 40%, 
                    #000000 70%, 
                    #000000 100%
                  )
                `,
                boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.9)'
              }}
            ></div>
            
            {/* Singularity */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
              style={{
                background: '#000000',
                boxShadow: `
                  0 0 20px rgba(255, 0, 0, 0.5),
                  inset 0 0 10px rgba(0, 0, 0, 1)
                `
              }}
            ></div>

          </div>
        </div>
      </div>
    </div>
  );
}
