import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SpeedModeToggle } from './SpeedModeToggle';

describe('SpeedModeToggle', () => {
  it('renders the controlled off state and requests the enabled state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<SpeedModeToggle enabled={false} onChange={onChange} />);

    const toggle = screen.getByRole('button', { name: 'Speed Mode Off' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(<SpeedModeToggle enabled onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Speed Mode On' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('is keyboard operable', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SpeedModeToggle enabled={false} onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Speed Mode Off' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
