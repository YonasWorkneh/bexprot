import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    this.setState({ errorInfo: error?.message || 'Unexpected error' });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            {this.state.errorInfo && (
              <p className="text-sm text-muted-foreground mb-4">{this.state.errorInfo}</p>
            )}
            <Button onClick={this.handleReload}>Reload</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
