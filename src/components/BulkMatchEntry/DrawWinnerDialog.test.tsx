import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrawWinnerDialog } from './DrawWinnerDialog';
import type { DrawMatch } from './types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      selectWinner: 'Select winner',
      back: 'Back',
    };
    return t[key] ?? key;
  },
}));

vi.mock('@/components/Button', () => ({
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

const pendingDraw: DrawMatch = {
  playerIndex: 0,
  opponentIndex: 1,
  player1Name: 'Alice',
  player2Name: 'Bob',
  hits: 5,
};

describe('DrawWinnerDialog', () => {
  it('renders the score line', () => {
    render(
      <DrawWinnerDialog
        pendingDraw={pendingDraw}
        onSelectWinner={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Alice 5 - 5 Bob')).toBeTruthy();
  });

  it('renders player buttons', () => {
    render(
      <DrawWinnerDialog
        pendingDraw={pendingDraw}
        onSelectWinner={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Alice' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bob' })).toBeTruthy();
  });

  it('renders the back button', () => {
    render(
      <DrawWinnerDialog
        pendingDraw={pendingDraw}
        onSelectWinner={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  });

  it('calls onSelectWinner with player1 name when player1 button clicked', () => {
    const onSelectWinner = vi.fn();
    render(
      <DrawWinnerDialog
        pendingDraw={pendingDraw}
        onSelectWinner={onSelectWinner}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
    expect(onSelectWinner).toHaveBeenCalledWith('Alice');
  });

  it('calls onSelectWinner with player2 name when player2 button clicked', () => {
    const onSelectWinner = vi.fn();
    render(
      <DrawWinnerDialog
        pendingDraw={pendingDraw}
        onSelectWinner={onSelectWinner}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Bob' }));
    expect(onSelectWinner).toHaveBeenCalledWith('Bob');
  });

  it('calls onCancel when back button clicked', () => {
    const onCancel = vi.fn();
    render(
      <DrawWinnerDialog
        pendingDraw={pendingDraw}
        onSelectWinner={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows the select winner heading', () => {
    render(
      <DrawWinnerDialog
        pendingDraw={pendingDraw}
        onSelectWinner={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Select winner')).toBeTruthy();
  });

  it('works with different player names and hit counts', () => {
    const draw: DrawMatch = {
      playerIndex: 2,
      opponentIndex: 3,
      player1Name: 'Charlie',
      player2Name: 'Dave',
      hits: 10,
    };
    render(
      <DrawWinnerDialog
        pendingDraw={draw}
        onSelectWinner={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Charlie 10 - 10 Dave')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Charlie' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dave' })).toBeTruthy();
  });
});
