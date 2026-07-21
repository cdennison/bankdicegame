import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameApp } from './GameApp';

describe('GameApp', () => {
  it('renders the setup heading', () => {
    render(<GameApp />);
    expect(screen.getByRole('heading', { name: /choose your opponents/i })).toBeInTheDocument();
  });
});
