import { supabase } from '../lib/supabase';

export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'welcome' | 'campaign_generation' | 'image' | 'video';
  campaign_id: string | null;
  description: string | null;
  created_at: string;
}

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && 
    url !== 'your_supabase_project_url' && 
    url.startsWith('http') &&
    key && 
    key !== 'your_supabase_anon_key' && 
    key.length > 20;
};

// LocalStorage fallback for when Supabase isn't configured
const localStorageService = {
  getTokenBalance(userId: string): number {
    const stored = localStorage.getItem(`magic_tokens_${userId}`);
    return stored ? parseInt(stored, 10) : 20; // Default 20 tokens
  },
  
  setTokenBalance(userId: string, balance: number): void {
    localStorage.setItem(`magic_tokens_${userId}`, balance.toString());
  },
  
  getTransactions(userId: string): TokenTransaction[] {
    const stored = localStorage.getItem(`magic_token_transactions_${userId}`);
    return stored ? JSON.parse(stored) : [];
  },
  
  addTransaction(transaction: Omit<TokenTransaction, 'id' | 'created_at'>): void {
    const transactions = this.getTransactions(transaction.user_id);
    const newTransaction: TokenTransaction = {
      ...transaction,
      id: `local_${Date.now()}_${Math.random()}`,
      created_at: new Date().toISOString(),
    };
    transactions.push(newTransaction);
    localStorage.setItem(`magic_token_transactions_${transaction.user_id}`, JSON.stringify(transactions));
    
    // Update balance
    const currentBalance = this.getTokenBalance(transaction.user_id);
    this.setTokenBalance(transaction.user_id, currentBalance + transaction.amount);
  },
};

export const tokenService = {
  /**
   * Get current Magic Tokens balance for a user
   */
  async getUserTokens(userId: string): Promise<number> {
    if (!isSupabaseConfigured()) {
      return localStorageService.getTokenBalance(userId);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('tokens')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.tokens ?? 20; // Default to 20 if null
    } catch (error) {
      console.warn('Supabase query failed, falling back to localStorage:', error);
      return localStorageService.getTokenBalance(userId);
    }
  },

  /**
   * Initialize welcome Magic Tokens (20 tokens) for a new user
   * Only adds tokens if user doesn't have any transactions yet
   */
  async initializeWelcomeTokens(userId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      // Check if user already has transactions
      const transactions = localStorageService.getTransactions(userId);
      if (transactions.length === 0) {
        localStorageService.addTransaction({
          user_id: userId,
          amount: 20,
          type: 'welcome',
          campaign_id: null,
          description: 'Welcome Magic Tokens',
        });
      }
      return;
    }

    try {
      // Check if user already has welcome tokens
      const { data: existingTransaction } = await supabase
        .from('token_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'welcome')
        .maybeSingle();

      if (existingTransaction) {
        // User already has welcome tokens
        return;
      }

      // Add welcome tokens transaction
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: userId,
          amount: 20,
          type: 'welcome',
          campaign_id: null,
          description: 'Welcome Magic Tokens',
        });

      if (transactionError) throw transactionError;

      // Update user's token balance
      const { error: updateError } = await supabase
        .from('users')
        .update({ tokens: 20 })
        .eq('id', userId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error initializing welcome tokens:', error);
      // Fallback to localStorage
      const transactions = localStorageService.getTransactions(userId);
      if (transactions.length === 0) {
        localStorageService.addTransaction({
          user_id: userId,
          amount: 20,
          type: 'welcome',
          campaign_id: null,
          description: 'Welcome Magic Tokens',
        });
      }
    }
  },

  /**
   * Deduct Magic Tokens for a transaction
   * In test mode, allows negative balances
   */
  async deductTokens(
    userId: string,
    amount: number,
    type: 'campaign_generation' | 'image' | 'video',
    campaignId: string | null = null,
    description?: string
  ): Promise<void> {
    const transactionAmount = -Math.abs(amount); // Ensure negative

    if (!isSupabaseConfigured()) {
      localStorageService.addTransaction({
        user_id: userId,
        amount: transactionAmount,
        type,
        campaign_id: campaignId,
        description: description || `Used ${Math.abs(amount)} Magic Tokens for ${type}`,
      });
      return;
    }

    try {
      // Add transaction record
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: userId,
          amount: transactionAmount,
          type,
          campaign_id: campaignId,
          description: description || `Used ${Math.abs(amount)} Magic Tokens for ${type}`,
        });

      if (transactionError) throw transactionError;

      // Update user's token balance
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('tokens')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentBalance = userData?.tokens ?? 20;
      const newBalance = currentBalance + transactionAmount; // transactionAmount is already negative

      const { error: updateError } = await supabase
        .from('users')
        .update({ tokens: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error deducting tokens:', error);
      // Fallback to localStorage
      localStorageService.addTransaction({
        user_id: userId,
        amount: transactionAmount,
        type,
        campaign_id: campaignId,
        description: description || `Used ${Math.abs(amount)} Magic Tokens for ${type}`,
      });
    }
  },

  /**
   * Calculate Magic Tokens cost for a campaign based on generated assets
   * Base cost: 2 tokens per campaign generation
   * Additional: 1 token per image, 5 tokens per video
   */
  calculateCampaignCost(contentType: string, generatedAssets: any): number {
    let cost = 2; // Base cost per campaign generation

    const images = generatedAssets?.images || [];
    const videos = generatedAssets?.videos || [];

    cost += images.length * 1; // 1 token per image
    cost += videos.length * 5; // 5 tokens per video

    return cost;
  },

  /**
   * Get token transaction history for a user
   */
  async getTokenHistory(userId: string): Promise<TokenTransaction[]> {
    if (!isSupabaseConfigured()) {
      return localStorageService.getTransactions(userId);
    }

    try {
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Supabase query failed, falling back to localStorage:', error);
      return localStorageService.getTransactions(userId);
    }
  },
};

