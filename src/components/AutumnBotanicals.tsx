export function MapleLeafIcon({
  className = 'w-5 h-5',
  color = '#C8521E',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 2.5L18.4 8.7L23.1 6.8L21.5 12.1L27.5 11.4L24.1 15.8L28.2 18.6L21.3 20.6L22.2 24.4L16.8 22.7V29.5H15.2V22.7L9.8 24.4L10.7 20.6L3.8 18.6L7.9 15.8L4.5 11.4L10.5 12.1L8.9 6.8L13.6 8.7L16 2.5Z"
        fill={color}
      />
    </svg>
  );
}

export function MapleDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-4" aria-hidden="true">
      <div className="h-px w-20 sm:w-28 bg-[#D8B899]" />
      <MapleLeafIcon className="w-5 h-5 shrink-0" color="#C8521E" />
      <div className="h-px w-20 sm:w-28 bg-[#D8B899]" />
    </div>
  );
}

export function CampusTowerBackdrop() {
  return (
    <svg
      viewBox="0 0 360 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none select-none w-full h-full opacity-20"
      aria-hidden="true"
    >
      <path
        d="M225 290V118L244 96L263 118V290H225Z"
        fill="#D6B28E"
        stroke="#B68964"
        strokeWidth="1.5"
      />
      <path
        d="M244 38L254 88H234L244 38Z"
        fill="#C99E78"
        stroke="#B68964"
        strokeWidth="1.5"
      />
      <rect x="234" y="88" width="20" height="10" fill="#DFC09F" stroke="#B68964" />
      <circle cx="244" cy="134" r="9" fill="#FAF1E4" stroke="#B68964" strokeWidth="1.5" />
      <path d="M244 128V134L248 136" stroke="#8C593B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M135 290V172H225V290H135Z" fill="#E3C7A8" stroke="#B68964" strokeWidth="1.5" />
      <path d="M126 172L180 136L234 172H126Z" fill="#D1A67E" stroke="#B68964" strokeWidth="1.5" />
      <rect x="150" y="196" width="16" height="28" rx="8" fill="#FAF1E4" stroke="#B68964" />
      <rect x="178" y="196" width="16" height="28" rx="8" fill="#FAF1E4" stroke="#B68964" />
      <rect x="150" y="242" width="16" height="28" rx="8" fill="#FAF1E4" stroke="#B68964" />
      <rect x="178" y="242" width="16" height="28" rx="8" fill="#FAF1E4" stroke="#B68964" />
      <rect x="263" y="182" width="68" height="108" fill="#E3C7A8" stroke="#B68964" strokeWidth="1.5" />
      <path d="M263 182L297 154L331 182H263Z" fill="#D1A67E" stroke="#B68964" strokeWidth="1.5" />
      <rect x="281" y="208" width="14" height="24" rx="7" fill="#FAF1E4" stroke="#B68964" />
      <rect x="303" y="208" width="14" height="24" rx="7" fill="#FAF1E4" stroke="#B68964" />
    </svg>
  );
}
