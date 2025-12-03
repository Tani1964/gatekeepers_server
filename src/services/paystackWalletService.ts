import axios from "axios";

export class PaystackWalletService {
  private static readonly BASE_URL = "https://api.paystack.co";
  private static readonly SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  // Create transfer recipient
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

  // Initiate transfer
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
          source: "balance",
          amount: amount , // Convert to kobo
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

  // NEW: Finalize transfer with OTP
  static async finalizeTransfer(transferCode: string, otp: string) {
    const url = `${this.BASE_URL}/transfer/finalize_transfer`;

    try {
      const response = await axios.post(
        url,
        {
          transfer_code: transferCode,
          otp: otp,
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
      console.error('Finalize transfer error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Verify transfer status
  static async verifyTransaction(reference: string) {
    const url = `${this.BASE_URL}/transfer/verify/${reference}`;

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

  // Get list of supported banks
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

  // Verify account number
  static async verifyAccount(accountNumber: string, bankCode: string) {
    console.log('Verifying account number:', accountNumber, 'with bank code:', bankCode);
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
      console.log(error)
      console.error('Account verification error:', error.response?.data || error.message);
      throw error;
    }
  }

  // NEW: Resend OTP
  static async resendOtp(transferCode: string, reason: string = "resend_otp") {
    const url = `${this.BASE_URL}/transfer/resend_otp`;

    try {
      const response = await axios.post(
        url,
        {
          transfer_code: transferCode,
          reason: reason,
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
      console.error('Resend OTP error:', error.response?.data || error.message);
      throw error;
    }
  }
}