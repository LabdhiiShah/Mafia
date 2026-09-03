// import React from 'react';

// function CloudBand({ className }) {
//   return (
//     <svg
//       viewBox="0 0 1200 120"
//       preserveAspectRatio="none"
//       className={className}
//       aria-hidden="true"
//       shapeRendering="crispEdges"
//     >
//       <path
//         fill="currentColor"
//         d="M0 70h60v-14h40v-12h70v12h60v-16h50v16h80v-10h60v10h40v-20h80v20h70v-12h50v12h60v-16h80v16h50v-10h70v10h60v-14h50v14h40v-18h60v18h70v-12h50v42H0z"
//       />
//     </svg>
//   );
// }

// export function Sky() {
//   return (
//     <div
//       aria-hidden="true"
//       className="absolute inset-0 overflow-hidden bg-[linear-gradient(to_bottom,var(--color-sky-top)_0%,#8a2fc0_35%,#d95fd0_70%,var(--color-sky-bottom)_100%)]"
//     >
//       {/* Far, slower cloud layer */}
//       <div className="absolute inset-x-0 top-[6%] flex h-16 w-[200%] animate-drift-slow text-cloud/40 sm:top-[8%] sm:h-20 md:h-28 motion-reduce:animate-none">
//         <CloudBand className="h-full w-1/2" />
//         <CloudBand className="h-full w-1/2" />
//       </div>
//       {/* Near, faster cloud layer */}
//       <div className="absolute inset-x-0 top-[22%] flex h-14 w-[200%] animate-drift text-cloud/55 sm:top-[24%] sm:h-16 md:h-24 motion-reduce:animate-none">
//         <CloudBand className="h-full w-1/2 -scale-x-100" />
//         <CloudBand className="h-full w-1/2 -scale-x-100" />
//       </div>
//       {/* Low haze band */}
//       <div className="absolute inset-x-0 top-[40%] flex h-10 w-[200%] animate-drift-slow text-cloud/25 md:h-14 motion-reduce:animate-none [animation-direction:reverse]">
//         <CloudBand className="h-full w-1/2" />
//         <CloudBand className="h-full w-1/2" />
//       </div>
//     </div>
//   );
// }


import React from 'react';

/**
 * Pixel art cloud band SVG.
 * Uses fill="currentColor" to inherit text colors set on parent wrapper.
 */
function CloudBand({ className }) {
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path
        fill="currentColor"
        d="M0 70h60v-14h40v-12h70v12h60v-16h50v16h80v-10h60v10h40v-20h80v20h70v-12h50v12h60v-16h80v16h50v-10h70v10h60v-14h50v14h40v-18h60v18h70v-12h50v42H0z"
      />
    </svg>
  );
}

export function Sky() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-[linear-gradient(to_bottom,#2d114d_0%,#8a2fc0_35%,#d95fd0_70%,#1a0b2e_100%)]"
    >
      {/* Far, slower cloud layer - replace #f3e8ff with your desired hex code */}
      <div className="absolute inset-x-0 top-[6%] flex h-16 w-[200%] animate-drift-slow text-[#f3e8ff]/40 sm:top-[8%] sm:h-20 md:h-28 motion-reduce:animate-none">
        <CloudBand className="h-full w-1/2" />
        <CloudBand className="h-full w-1/2" />
      </div>

      {/* Near, faster cloud layer */}
      <div className="absolute inset-x-0 top-[22%] flex h-14 w-[200%] animate-drift text-[#f3e8ff]/60 sm:top-[24%] sm:h-16 md:h-24 motion-reduce:animate-none">
        <CloudBand className="h-full w-1/2 -scale-x-100" />
        <CloudBand className="h-full w-1/2 -scale-x-100" />
      </div>

      {/* Low haze band */}
      <div className="absolute inset-x-0 top-[40%] flex h-10 w-[200%] animate-drift-slow text-[#f3e8ff]/25 md:h-14 motion-reduce:animate-none [animation-direction:reverse]">
        <CloudBand className="h-full w-1/2" />
        <CloudBand className="h-full w-1/2" />
      </div>
    </div>
  );
}

export default Sky;