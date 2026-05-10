interface TestimonialCardProps {
  name: string;
  role: string;
  quote: string;
  skillTag: string;
  initials: string;
  accentColor: string;
}

export default function TestimonialCard({ name, role, quote, skillTag, initials, accentColor }: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-2xl p-7 sm:p-8 border border-[#E5E5E3] flex flex-col h-full hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:border-[#D4D4D0] transition-all duration-300 hover:-translate-y-1">
      {/* Quote */}
      <div className="flex-1 mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#E5E5E3] mb-3">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="currentColor" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="currentColor" />
        </svg>
        <p className="text-[#4B5563] text-sm leading-relaxed">{quote}</p>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#1A1A1A] text-sm font-medium">{name}</p>
          <p className="text-[#9CA3AF] text-xs">{role}</p>
        </div>
        <span
          className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
        >
          {skillTag}
        </span>
      </div>
    </div>
  );
}
