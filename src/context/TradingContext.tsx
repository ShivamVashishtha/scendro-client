import React, { createContext, useContext, useState } from 'react';

type Holding = {
  symbol: string;
  quantity: number;
  avgPrice: number;
};

type Trade = {
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
  realizedPL: number;
};

export type OptionTrade = {
  type: 'BUY_CALL' | 'SELL_CALL' | 'BUY_PUT' | 'SELL_PUT';
  symbol: string;
  contracts: number;
  price: number;
  realizedPL: number;
};

export type QueuedOptionTrade = {
  type: 'BUY_CALL' | 'SELL_CALL' | 'BUY_PUT' | 'SELL_PUT';
  symbol: string;
  contracts: number;
  price: number;
};

export type QueuedTrade = {
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
};

type TradingContextType = {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  holdings: Holding[];
  setHoldings: React.Dispatch<React.SetStateAction<Holding[]>>;
  trades: Trade[];
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  optionTrades: OptionTrade[];
  setOptionTrades: React.Dispatch<React.SetStateAction<OptionTrade[]>>;
  queuedOptionTrades: QueuedOptionTrade[];
  setQueuedOptionTrades: React.Dispatch<React.SetStateAction<QueuedOptionTrade[]>>;
  queuedOrders: QueuedTrade[];
  setQueuedOrders: React.Dispatch<React.SetStateAction<QueuedTrade[]>>;
  isSetupComplete: boolean;
  setIsSetupComplete: React.Dispatch<React.SetStateAction<boolean>>;
};

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) throw new Error('useTrading must be used within TradingProvider');
  return context;
};

export const TradingProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [optionTrades, setOptionTrades] = useState<OptionTrade[]>([]);
  const [queuedOptionTrades, setQueuedOptionTrades] = useState<QueuedOptionTrade[]>([]);
  const [queuedOrders, setQueuedOrders] = useState<QueuedTrade[]>([]);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  return (
    <TradingContext.Provider
      value={{
        balance,
        setBalance,
        holdings,
        setHoldings,
        trades,
        setTrades,
        optionTrades,
        setOptionTrades,
        queuedOptionTrades,
        setQueuedOptionTrades,
        queuedOrders,
        setQueuedOrders,
        isSetupComplete,
        setIsSetupComplete,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};







