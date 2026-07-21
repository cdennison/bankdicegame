import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OPPONENT_PROFILES } from '../../strategies/reveals';
import { SetupScreen, type SetupSubmission } from './SetupScreen';

const generatedCode = 'BK1-AAKD-JXV2';

afterEach(cleanup);

const renderSetup = () => {
  const onStart = vi.fn<(submission: SetupSubmission) => void>();
  const generateCode = vi.fn(() => generatedCode);
  render(
    <SetupScreen
      opponents={OPPONENT_PROFILES}
      onStart={onStart}
      generateCode={generateCode}
    />,
  );
  return { onStart, generateCode };
};

describe('SetupScreen', () => {
  it('requires at least one opponent before starting', () => {
    renderSetup();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeDisabled();
    expect(screen.getAllByText(/human player/i)).toHaveLength(1);
  });

  it('keeps unique opponents in selection order and blocks a fourth selection', async () => {
    const user = userEvent.setup();
    renderSetup();

    await user.click(screen.getByRole('button', { name: /select vega/i }));
    await user.click(screen.getByRole('button', { name: /select mira/i }));
    await user.click(screen.getByRole('button', { name: /select knox/i }));

    expect(screen.getByRole('button', { name: /select vega/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /select mira/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /select knox/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /select .*fourth/i })).not.toBeInTheDocument();

    const lineup = screen.getByRole('list', { name: /your lineup/i });
    expect(lineup.textContent).toMatch(/You.*Vega.*Mira.*Knox/);
  });

  it('submits the human name, ordered opponent ids, and a valid supplied code', async () => {
    const user = userEvent.setup();
    const { onStart, generateCode } = renderSetup();

    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), 'Rae');
    await user.click(screen.getByRole('button', { name: /select mira/i }));
    await user.click(screen.getByRole('button', { name: /select vega/i }));
    await user.type(screen.getByLabelText(/challenge code/i), generatedCode);
    await user.click(screen.getByRole('button', { name: /^start$/i }));

    expect(onStart).toHaveBeenCalledWith({
      humanName: 'Rae',
      opponentIds: ['mira', 'vega'],
      seedCode: generatedCode,
    });
    expect(generateCode).not.toHaveBeenCalled();
  });

  it('shows an associated inline error and blocks an invalid challenge code', async () => {
    const user = userEvent.setup();
    const { onStart } = renderSetup();

    await user.click(screen.getByRole('button', { name: /select mira/i }));
    const codeField = screen.getByLabelText(/challenge code/i);
    await user.type(codeField, 'not-a-code');
    await user.click(screen.getByRole('button', { name: /^start$/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/BK1-XXXX-XXXX/i);
    expect(codeField).toHaveAttribute('aria-invalid', 'true');
    expect(codeField).toHaveAccessibleDescription(/BK1-XXXX-XXXX/i);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('generates a code for a blank seed and supports keyboard form submission', async () => {
    const user = userEvent.setup();
    const { onStart, generateCode } = renderSetup();

    await user.type(screen.getByLabelText(/your name/i), '{Control>}a{/Control}Kai');
    await user.click(screen.getByRole('button', { name: /select knox/i }));
    await user.click(screen.getByLabelText(/challenge code/i));
    await user.keyboard('{Enter}');

    expect(generateCode).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledWith({
      humanName: 'Kai',
      opponentIds: ['knox'],
      seedCode: generatedCode,
    });
  });

  it('removes an opponent and allows that strategy to be selected again', async () => {
    const user = userEvent.setup();
    renderSetup();

    await user.click(screen.getByRole('button', { name: /select mira/i }));
    await user.click(screen.getByRole('button', { name: /remove mira/i }));

    expect(screen.getByRole('button', { name: /select mira/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^start$/i })).toBeDisabled();
  });
});
