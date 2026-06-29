'use client';

import { useState } from 'react';
import Image from 'next/image';

export function CreatorAvatar() {
  const [failed, setFailed] = useState(false);

  return (
    <>
      {/* decorative frame in the background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-36 h-36 rounded-2xl ring-4 ring-white/20 bg-white/10" />
      </div>

      {/* photo fills the entire parent panel */}
      {!failed ? (
        <div className="absolute inset-0">
          <Image
            src="/me.png"
            alt="Jyotirmoy Baidya"
            fill
            className="object-cover object-top"
            onError={() => setFailed(true)}
          />
          {/* subtle gradient overlay at bottom for readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-700/60 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white text-5xl font-bold select-none">
          JB
        </div>
      )}
    </>
  );
}
