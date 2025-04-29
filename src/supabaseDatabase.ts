// supabaseDatabase.ts
import { supabase } from "./supabaseClient";

// 🔵 Save a holding to portfolio
export async function saveHolding(userId: string, symbol: string, quantity: number, avgPrice: number) {
  const { error } = await supabase.from('portfolio_holdings').insert({
    user_id: userId,
    symbol,
    quantity,
    avg_price: avgPrice,
  });
  return error;
}

// 🔵 Load holdings for user
export async function loadHoldings(userId: string) {
  const { data, error } = await supabase
    .from('portfolio_holdings')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
}

// 🔵 Save a paper trade (status = 'executed' | 'queued')
export async function savePaperTrade(
  userId: string,
  ticker: string,
  quantity: number,
  price: number,
  orderType: string,
  status: string = 'executed'
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

// 🔵 Load all paper trades for a user
export async function loadPaperTrades(userId: string) {
  const { data, error } = await supabase
    .from('paper_trades')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
}

// 🔵 Save an option trade (queued or executed)
export async function saveOptionTrade(
  userId: string,
  optionSymbol: string,
  strikePrice: number,
  quantity: number,
  price: number,
  status: string = 'executed'
) {
  const { error } = await supabase.from('options_trades').insert({
    user_id: userId,
    option_symbol: optionSymbol,
    strike_price: strikePrice,
    quantity,
    price,
    status,
  });
  return error;
}

// 🔵 Load all option trades for user
export async function loadOptionTrades(userId: string) {
  const { data, error } = await supabase
    .from('options_trades')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
}

// 🔴 Delete a queued option trade (on cancel)
export async function deleteQueuedOptionTrade(
  userId: string,
  optionSymbol: string,
  quantity: number,
  price: number
) {
  const { error } = await supabase
    .from('options_trades')
    .delete()
    .match({
      user_id: userId,
      option_symbol: optionSymbol,
      quantity,
      price,
      status: 'queued'
    });
  return error;
}

// 🔴 Delete a queued paper trade (on cancel)
export async function deleteQueuedPaperTrade(
  userId: string,
  ticker: string,
  quantity: number,
  price: number
) {
  const { error } = await supabase
    .from('paper_trades')
    .delete()
    .match({
      user_id: userId,
      ticker,
      quantity,
      price,
      status: 'queued'
    });
  return error;
}
