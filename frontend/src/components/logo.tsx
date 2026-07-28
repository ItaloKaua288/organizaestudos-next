export const Logo = () => {
  return (
    <div className="flex items-center gap-1">
      <LogoSvg />
      <div className="">
        <span className="font-semibold">Organiza</span>
        <span className="text-primary font-bold">Estudos</span>
      </div>
    </div>
  )
};

export const LogoSvg = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 31 32"
      width="31"
      height="32"
      fill="#606060"
    >
      {/* Ícone de Pasta Novo */}
      <g transform="translate(0, 4) scale(0.04)">
        <path d="M40 70 C40 50, 55 35, 75 35 L 210 35 C 225 35, 235 45, 245 55 L 260 70 L 740 70 C 760 70, 775 85, 775 105 L 775 520 C 775 540, 760 555, 740 555 L 40 555 Z" fill="#4484C5" />

        <rect x="60" y="110" width="340" height="200" rx="10" fill="#F8F9FA" />

        <path d="M 30 220 L 240 220 C 255 220, 265 205, 275 190 L 290 170 L 450 170 C 460 170, 465 175, 465 185 L 465 540 C 465 550, 455 560, 440 560 L 50 560 C 39 560, 30 551, 30 540 L 30 220 Z" fill="#58A3E4" />

        <rect x="440" y="70" width="320" height="480" rx="10" fill="#A8D5F2" />

        <rect x="455" y="80" width="295" height="460" rx="10" fill="#FFFFFF" />

        <rect x="495" y="130" width="45" height="45" rx="5" fill="#FFFFFF" stroke="#68A5BA" strokeWidth="6" />
        <path d="M 505 150 L 515 160 L 540 120" fill="none" stroke="#2C6C8E" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="560" y1="145" x2="705" y2="145" stroke="#89B5C4" strokeWidth="6" strokeLinecap="round" />
        <line x1="560" y1="165" x2="705" y2="165" stroke="#89B5C4" strokeWidth="6" strokeLinecap="round" />

        <rect x="495" y="225" width="45" height="45" rx="5" fill="#FFFFFF" stroke="#68A5BA" strokeWidth="6" />
        <path d="M 505 245 L 515 255 L 540 215" fill="none" stroke="#2C6C8E" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="560" y1="240" x2="705" y2="240" stroke="#89B5C4" strokeWidth="6" strokeLinecap="round" />
        <line x1="560" y1="260" x2="705" y2="260" stroke="#89B5C4" strokeWidth="6" strokeLinecap="round" />

        <rect x="495" y="320" width="45" height="45" rx="5" fill="#FFFFFF" stroke="#68A5BA" strokeWidth="6" />
        <line x1="560" y1="335" x2="705" y2="335" stroke="#89B5C4" strokeWidth="6" strokeLinecap="round" />
        <line x1="560" y1="355" x2="705" y2="355" stroke="#89B5C4" strokeWidth="6" strokeLinecap="round" />

        <rect x="495" y="415" width="45" height="45" rx="5" fill="#FFFFFF" stroke="#68A5BA" strokeWidth="6" />
        <path d="M 505 435 L 515 445 L 540 405" fill="none" stroke="#2C6C8E" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="560" y1="430" x2="705" y2="430" stroke="#89B5C4" strokeWidth="6" strokeLinecap="round" />
        <line x1="560" y1="450" x2="705" y2="450" stroke="#89B5C4" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  )
}