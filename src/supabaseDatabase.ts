// eslint-disable-next-line
import { supabase } from "./supabaseClient";

// Save a holding
export async function saveHolding(userId: string, symbol: string, quantity: number, avgPrice: number) {
  const { error } = await supabase.from('portfolio_holdings').insert({
    user_id: userId,
    symbol,
    quantity,
    avg_price: avgPrice,
  });
  return error;
}

// Load holdings
export async function loadHoldings(userId: string) {
  const { data, error } = await supabase
    .from('portfolio_holdings')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
}

// Save paper trade
export async function savePaperTrade(
  userId: string,
  ticker: string,
  quantity: number,
  price: number,
  orderType: string,
  status: string  // <--- fix here
) {
  const { error } = await supabase.from('paper_trades').insert({
    user_id: userId,
    ticker,
    quantity,
    price,
    order_type: orderType,
    status,
  });
  return error;
}

// Load paper trades
export async function loadPaperTrades(userId: string) {
  const { data, error } = await supabase
    .from('paper_trades')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
}


// Save option trade
export async function saveOptionTrade(userId: string, optionSymbol: string, strikePrice: number, quantity: number, price: number) {
  const { error } = await supabase.from('options_trades').insert({
    user_id: userId,
    option_symbol: optionSymbol,
    strike_price: strikePrice,
    quantity,
    price,
  });
  return error;
}

// Load option trades
export async function loadOptionTrades(userId: string) {
  const { data, error } = await supabase
    .from('options_trades')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
}
