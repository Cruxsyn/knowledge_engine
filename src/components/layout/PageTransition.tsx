export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-in h-full flex flex-col">
      {children}
    </div>
  )
}
