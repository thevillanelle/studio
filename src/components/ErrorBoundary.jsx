import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error("[m'atelier] Uncaught error:", error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="page-bg min-h-screen flex items-center justify-center px-8">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-6">✦</p>
          <h2 className="font-display text-at-ink text-3xl mb-4">Something went wrong.</h2>
          <p className="text-at-muted font-body text-sm mb-8">
            Reload to get back to your studio.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary w-full">
            Reload
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-6 text-left text-xs text-red-400 bg-red-50 p-4 rounded-xl overflow-auto max-h-40">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
