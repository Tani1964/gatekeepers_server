import axios from "axios";

export class PaystackWalletService {
  private static readonly BASE_URL = "https://api.paystack.co";
  private static readonly SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  // Step 1: Create transfer recipient
  static async createTransferRecipient(
    name: string, 
    accountNumber: string, 
    bankCode: string,
    currency: string = "NGN"
  ) {
    const url = `${this.BASE_URL}/transferrecipient`;

    try {
      const response = await axios.post(
        url,
        {
          type: "nuban",
          name,
          account_number: accountNumber,
          bank_code: bankCode,
          currency,
        },
        {
          headers: {
            Authorization: `Bearer ${this.SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Create recipient error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Step 2: Initiate transfer to user
  static async initializeTransaction(
    amount: number,
    recipientCode: string,
    reason: string = "Wallet withdrawal",
    reference?: string
  ) {
    const url = `${this.BASE_URL}/transfer`;

    try {
      const response = await axios.post(
        url,
        {
          source: "balance", // Transfer from your Paystack balance
          amount: amount * 100, // Convert to kobo
          recipient: recipientCode,
          reason,
          reference: reference || `transfer_${Date.now()}`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Transfer error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Step 3: Verify transfer status
  static async verifyTransaction(transferCode: string) {
    const url = `${this.BASE_URL}/transfer/verify/${transferCode}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.SECRET_KEY}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Verify transfer error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Helper: Get list of supported banks
  static async getBanks() {
    const url = `${this.BASE_URL}/bank`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.SECRET_KEY}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Get banks error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Helper: Verify account number
  static async verifyAccount(accountNumber: string, bankCode: string) {
    const url = `${this.BASE_URL}/bank/resolve`;

    try {
      const response = await axios.get(url, {
        params: {
          account_number: accountNumber,
          bank_code: bankCode,
        },
        headers: {
          Authorization: `Bearer ${this.SECRET_KEY}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Account verification error:', error.response?.data || error.message);
      throw error;
    }
  }
}