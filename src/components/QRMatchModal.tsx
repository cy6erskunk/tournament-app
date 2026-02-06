'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTournamentContext } from '@/context/TournamentContext';
import { Player } from '@/types/Player';
import QRMatchCode from './QRMatchCode';
import { QRMatchData } from '@/types/QRMatch';

interface QRMatchModalProps {
  closeModal: () => void;
  player1?: Player;
  player2?: Player;
}

export default function QRMatchModal({ closeModal, player1, player2 }: QRMatchModalProps) {
  const [qrData, setQrData] = useState<QRMatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer1, setSelectedPlayer1] = useState(player1?.player.player_name || '');
  const [selectedPlayer2, setSelectedPlayer2] = useState(player2?.player.player_name || '');

  const t = useTranslations('NewMatch');
  const context = useTournamentContext();

  const generateQRCode = async () => {
    if (!selectedPlayer1 || !selectedPlayer2) {
      alert(t('selectbothplayers'));
      return;
    }

    if (selectedPlayer1 === selectedPlayer2) {
      alert(t('duplicateplayers'));
      return;
    }

    if (!context.tournament) {
      alert(t('notournamentfound'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/qr-match/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1: selectedPlayer1,
          player2: selectedPlayer2,
          tournamentId: context.tournament.id,
          round: context.activeRound,
          match: 1, // Default match number, could be calculated
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const qrMatchData: QRMatchData = await response.json();
      setQrData(qrMatchData);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableOpponents = (selectedPlayer: string) => {
    return context.players.filter(player => {
      if (!player || player.player.player_name === selectedPlayer) return false;

      // Check if players have already played against each other in current round
      const playerMatches = player.matches.filter(match => match.round === context.activeRound);
      const hasPlayedAgainst = playerMatches.some(match =>
        match.player1 === selectedPlayer || match.player2 === selectedPlayer
      );

      return !hasPlayedAgainst;
    });
  };

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        Generate QR Code for Match
      </h1>

      {!qrData ? (
        <div className="flex flex-col space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="player1" className="block text-sm font-medium text-gray-700">
                {t('player1')}
              </label>
              {player1 ? (
                <input
                  type="text"
                  value={selectedPlayer1}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2"
                />
              ) : (
                <select
                  value={selectedPlayer1}
                  onChange={(e) => setSelectedPlayer1(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Player 1</option>
                  {context.players.map((player) =>
                    player ? (
                      <option key={player.player.player_name} value={player.player.player_name}>
                        {player.player.player_name}
                      </option>
                    ) : null
                  )}
                </select>
              )}
            </div>

            <div className="flex-1">
              <label htmlFor="player2" className="block text-sm font-medium text-gray-700">
                {t('player2')}
              </label>
              {player2 ? (
                <input
                  type="text"
                  value={selectedPlayer2}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2"
                />
              ) : (
                <select
                  value={selectedPlayer2}
                  onChange={(e) => setSelectedPlayer2(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Player 2</option>
                  {getAvailableOpponents(selectedPlayer1).map((player) =>
                    player ? (
                      <option key={player.player.player_name} value={player.player.player_name}>
                        {player.player.player_name}
                      </option>
                    ) : null
                  )}
                </select>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Round:</strong> {context.activeRound}</p>
            <p><strong>Tournament:</strong> {context.tournament?.name}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <button
              type="button"
              onClick={generateQRCode}
              disabled={loading || !selectedPlayer1 || !selectedPlayer2}
              className="disabled:bg-blue-300 bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {loading ? t('generating') : t('generateQR')}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            >
              {t('back')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <QRMatchCode matchData={qrData} size={300} />

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              QR code generated for match between <strong>{qrData.player1}</strong> and <strong>{qrData.player2}</strong>
            </p>
            <p className="text-xs text-gray-500">
              Third-party apps can scan this code to submit match results
            </p>
            <p className="text-xs text-gray-500">
              Submit URL: {qrData.submitUrl}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 w-full text-sm font-semibold">
            <button
              type="button"
              onClick={() => setQrData(null)}
              className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            >
              {t('generateNew')}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="disabled:bg-blue-300 bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {t('done')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}