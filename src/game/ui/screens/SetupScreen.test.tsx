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
    expect(screen.getAllByText(/human player/i).length).toBeGreaterThan(0);
  });

  it('caps the v1 roster at all three real profiles and submits them in click order', async () => {
    const user = userEvent.setup();
    const { onStart } = renderSetup();

    await user.click(screen.getByRole('button', { name: /select vega/i }));
    await user.click(screen.getByRole('button', { name: /select mira/i }));
    await user.click(screen.getByRole('button', { name: /select knox/i }));

    expect(screen.getByRole('button', { name: /select vega/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /select mira/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /select knox/i })).toBeDisabled();

    const lineup = screen.getByRole('list', { name: /your lineup/i });
    expect(lineup.textContent).toMatch(/You.*Vega.*Mira.*Knox/);

    await user.click(screen.getByRole('button', { name: /^start$/i }));
    expect(onStart).toHaveBeenCalledWith({
      humanNames: ['You'],
      opponentIds: ['vega', 'mira', 'knox'],
      seedCode: generatedCode,
    });
  });

  it('submits the human name, ordered opponent ids, and a valid supplied code', async () => {
    const user = userEvent.setup();
    const { onStart, generateCode } = renderSetup();

    await user.clear(screen.getByLabelText(/human player 1 name/i));
    await user.type(screen.getByLabelText(/human player 1 name/i), 'Rae');
    await user.click(screen.getByRole('button', { name: /select mira/i }));
    await user.click(screen.getByRole('button', { name: /select vega/i }));
    await user.type(screen.getByLabelText(/challenge code/i), generatedCode);
    await user.click(screen.getByRole('button', { name: /^start$/i }));

    expect(onStart).toHaveBeenCalledWith({
      humanNames: ['Rae'],
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
    expect(codeField).toHaveFocus();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('generates a code for a blank seed and supports keyboard form submission', async () => {
    const user = userEvent.setup();
    const { onStart, generateCode } = renderSetup();

    await user.type(screen.getByLabelText(/human player 1 name/i), '{Control>}a{/Control}Kai');
    await user.click(screen.getByRole('button', { name: /select knox/i }));
    await user.click(screen.getByLabelText(/challenge code/i));
    await user.keyboard('{Enter}');

    expect(generateCode).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledWith({
      humanNames: ['Kai'],
      opponentIds: ['knox'],
      seedCode: generatedCode,
    });
  });

  it('adds a second human seat, caps the roster at four total, and submits both names', async () => {
    const user = userEvent.setup();
    const { onStart } = renderSetup();

    await user.click(screen.getByRole('button', { name: /add a human player/i }));
    await user.type(screen.getByLabelText(/human player 2 name/i), 'Sam');
    await user.click(screen.getByRole('button', { name: /select vega/i }));
    await user.click(screen.getByRole('button', { name: /select mira/i }));

    expect(screen.getByRole('button', { name: /select knox/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /add a human player/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /^start$/i }));
    expect(onStart).toHaveBeenCalledWith({
      humanNames: ['You', 'Sam'],
      opponentIds: ['vega', 'mira'],
      seedCode: generatedCode,
    });
  });

  it('removes a human seat and re-enables adding one back', async () => {
    const user = userEvent.setup();
    const { onStart } = renderSetup();

    await user.click(screen.getByRole('button', { name: /add a human player/i }));
    await user.click(screen.getByRole('button', { name: /remove human player 2/i }));
    await user.click(screen.getByRole('button', { name: /select knox/i }));
    await user.click(screen.getByRole('button', { name: /^start$/i }));

    expect(onStart).toHaveBeenCalledWith({
      humanNames: ['You'],
      opponentIds: ['knox'],
      seedCode: generatedCode,
    });
  });

  it('removes, re-enables, and reselects an opponent at the end of the lineup', async () => {
    const user = userEvent.setup();
    const { onStart } = renderSetup();

    await user.click(screen.getByRole('button', { name: /select mira/i }));
    await user.click(screen.getByRole('button', { name: /select vega/i }));
    await user.click(screen.getByRole('button', { name: /remove mira/i }));

    expect(screen.getByRole('button', { name: /select mira/i })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /select mira/i }));

    expect(screen.getByRole('button', { name: /select mira/i })).toBeDisabled();
    expect(screen.getByRole('list', { name: /your lineup/i }).textContent)
      .toMatch(/You.*Vega.*Mira/);

    await user.click(screen.getByRole('button', { name: /^start$/i }));
    expect(onStart).toHaveBeenCalledWith({
      humanNames: ['You'],
      opponentIds: ['vega', 'mira'],
      seedCode: generatedCode,
    });
  });
});
