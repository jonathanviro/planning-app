export default function TotemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-gradient-to-br from-neutral-grey-soft via-[#e5e5e5] to-brand-red-soft p-8">
      {/* Header con Logo - Ahora en flujo normal (no absolute) para evitar superposición */}
      <div className="w-full max-w-[1080px] flex justify-end items-center gap-4 mb-4 z-50">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-28 w-auto object-contain drop-shadow-xl"
        />
      </div>

      {/* Elementos decorativos de fondo (Lúdico) */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-brand-red/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-brand-red/20 blur-3xl" />

      <div className="relative z-10 flex h-full w-full max-w-[1080px] flex-col flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
