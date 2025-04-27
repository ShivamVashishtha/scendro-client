import React from 'react';

type Props = {
  action: 'BUY' | 'SELL';
  setAction: (val: 'BUY' | 'SELL') => void;
  type: 'CALL' | 'PUT';
  setType: (val: 'CALL' | 'PUT') => void;
};

export default function TradeTypeSelector({ action, setAction, type, setType }: Props) {
  return (
    <div className="flex gap-4 mb-4">
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded ${action === 'BUY' ? 'bg-green-600 text-white' : 'bg-gray-700'}`}
          onClick={() => setAction('BUY')}
        >
          Buy
        </button>
        <button
          className={`px-4 py-2 rounded ${action === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-700'}`}
          onClick={() => setAction('SELL')}
        >
          Sell
        </button>
      </div>
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded ${type === 'CALL' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}
          onClick={() => setType('CALL')}
        >
          Call
        </button>
        <button
          className={`px-4 py-2 rounded ${type === 'PUT' ? 'bg-purple-600 text-white' : 'bg-gray-700'}`}
          onClick={() => setType('PUT')}
        >
          Put
        </button>
      </div>
    </div>
  );
}
