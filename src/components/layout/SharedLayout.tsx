import { Outlet, Link } from 'react-router-dom'

export function SharedLayout() {
  return (
    <div className="min-h-screen bg-obsidian">
      {/* Header */}
      <header className="border-b border-ash-stone/50 bg-charcoal-slate">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <h1 className="font-serif text-xl text-icon-gold font-semibold">
                Arkvim
              </h1>
              <span className="text-sm text-warm-gray">/ Shared Knowledge</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-ash-stone/50 mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <p className="text-sm text-warm-gray text-center">
            Shared via{' '}
            <Link to="/" className="text-icon-gold hover:underline">
              Arkvim Knowledge Engine
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
