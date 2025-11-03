// services/paystackPaymentService.ts
import axios from "axios";

interface InitializePaymentParams {
  email: string;
  amount: number; // in kobo
  metadata: {
    userId: string;
    eyes: number;
    type: string;
    customer_name?: string;
    [key: string]: any;
  };
  callback_url?: string;
  reference?: string;
}

export class PaystackPaymentService {
  private static readonly BASE_URL = "https://api.paystack.co";
  private static readonly SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  /**
   * Initialize a payment transaction
   */
  static async initializePayment(params: InitializePaymentParams) {
    const url = `${this.BASE_URL}/transaction/initialize`;

    try {
      const response = await axios.post(
        url,
        {
          email: params.email,
          amount: params.amount,
          metadata: params.metadata,
          callback_url: params.callback_url,
          reference: params.reference || `eyes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          currency: "NGN",
          channels: ["card", "bank", "ussd", "bank_transfer"],
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
      console.error("Initialize payment error:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verify a payment transaction
   */
  static async verifyPayment(reference: string) {
    const url = `${this.BASE_URL}/transaction/verify/${reference}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.SECRET_KEY}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Verify payment error:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get all transactions for a customer
   */
  static async getCustomerTransactions(email: string) {
    const url = `${this.BASE_URL}/transaction`;

    try {
      const response = await axios.get(url, {
        params: {
          customer: email,
        },
        headers: {
          Authorization: `Bearer ${this.SECRET_KEY}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Get transactions error:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check transaction status
   */
  static async getTransactionStatus(reference: string) {
    try {
      const verification = await this.verifyPayment(reference);
      
      return {
        status: verification.status,
        reference: reference,
        transactionStatus: verification.data?.status,
        amount: verification.data?.amount,
        paid_at: verification.data?.paid_at,
        metadata: verification.data?.metadata,
      };
    } catch (error: any) {
      console.error("Get transaction status error:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * List all transactions
   */
  static async listTransactions(params?: {
    perPage?: number;
    page?: number;
    status?: string;
    from?: string;
    to?: string;
  }) {
    const url = `${this.BASE_URL}/transaction`;

    try {
      const response = await axios.get(url, {
        params,
        headers: {
          Authorization: `Bearer ${this.SECRET_KEY}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("List transactions error:", error.response?.data || error.message);
      throw error;
    }
  }
}