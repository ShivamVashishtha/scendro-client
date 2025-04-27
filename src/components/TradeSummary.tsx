import React from 'react';

type Props = {
  symbol: string;
  action: 'BUY' | 'SELL';
  type: 'CALL' | 'PUT';
  contracts: number;
  premium: number;
  strike: number;
  expiration: string;
  breakeven: number;
};

export default function TradeSummary({
  symbol,
  action,
  type,
  contracts,
  premium,
  strike,
  expiration,
  breakeven,
}: Props) {
  const cost = (contracts * premium * 100).toFixed(2);
  const label = action === 'BUY' ? 'Total Cost' : 'Total Credit';

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-md w-full">
      <h2 className="text-xl font-bold mb-4">Trade Summary</h2>
      <p><strong>Symbol:</strong> {symbol}</p>
      <p><strong>Strategy:</strong> {action} {type}</p>
      <p><strong>Strike:</strong> ${strike}</p>
      <p><strong>Expiration:</strong> {expiration}</p>
      <p><strong>Premium:</strong> ${premium}</p>
      <p><strong>Contracts:</strong> {contracts}</p>
      <p><strong>Breakeven Price:</strong> ${breakeven.toFixed(2)}</p>
      <p className="mt-2 text-lg"><strong>{label}:</strong> ${cost}</p>
    </div>
  );
}

