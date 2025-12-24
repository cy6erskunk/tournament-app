'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QRMatchData } from '@/types/QRMatch';

interface QRMatchCodeProps {
  matchData: QRMatchData;
  size?: number;
}

export default function QRMatchCode({ matchData, size = 200 }: QRMatchCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const qrData = JSON.stringify(matchData);
        const url = await QRCode.toDataURL(qrData, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        
        setQrCodeUrl(url);
      } catch (err) {
        setError('Failed to generate QR code');
        console.error('QR code generation error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [matchData, size]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-red-50 border border-red-200 rounded-sm" style={{ width: size, height: size }}>
        <p className="text-red-600 text-sm text-center p-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <img src={qrCodeUrl} alt="Match QR Code" className="border border-gray-200 rounded-sm" />
      <div className="text-sm text-gray-600 text-center">
        <p className="font-medium">{matchData.player1} vs {matchData.player2}</p>
        <p className="text-xs">Match ID: {matchData.matchId.slice(0, 8)}...</p>
      </div>
    </div>
  );
}