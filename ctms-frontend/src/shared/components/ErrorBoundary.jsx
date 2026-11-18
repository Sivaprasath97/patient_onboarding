import { Component } from 'react';

/** Catches render errors so one broken page doesn't blank the whole app. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info?.componentStack);
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <span className="w-14 h-14 rounded-full bg-error-container text-error inline-flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">bug_report</span>
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Something went wrong on this page</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            The error has been logged. Try again, or go back to the dashboard.
          </p>
          <div className="flex justify-center gap-2">
            <button onClick={() => this.setState({ error: null })}
              className="h-9 px-3.5 rounded-lg border border-[#CBD5E1] font-label-lg text-label-lg hover:bg-surface-container-low">Try again</button>
            <a href="/" className="h-9 px-3.5 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg inline-flex items-center hover:bg-primary">Go to dashboard</a>
          </div>
        </div>
      </main>
    );
  }
}
