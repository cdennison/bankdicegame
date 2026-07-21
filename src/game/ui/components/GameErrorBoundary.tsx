import { Component, type ErrorInfo, type ReactNode } from 'react';

interface GameErrorBoundaryProps {
  readonly children: ReactNode;
  onRestart(): void;
}

interface GameErrorBoundaryState {
  readonly failed: boolean;
}

export class GameErrorBoundary extends Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  state: GameErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): GameErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Bank It render failure', error, info);
  }

  private restart = () => {
    this.props.onRestart();
    this.setState({ failed: false });
  };

  render() {
    if (this.state.failed) {
      return (
        <section className="screen game-error" aria-labelledby="game-error-title">
          <p className="kicker">Recovery mode</p>
          <h1 id="game-error-title">Game interrupted</h1>
          <p>Your match could not continue. Start a clean game.</p>
          <button type="button" onClick={this.restart}>Restart</button>
        </section>
      );
    }
    return this.props.children;
  }
}
