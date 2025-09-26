import { Wallet } from "../../models/Wallet";
import { PaystackWalletService } from "../../services/paystackWalletService";

const walletService = new PaystackWalletService();

export class WalletController {
  async fundWallet(req: any, res: any) {
    const { amount } = req.body;
    const response = await PaystackWalletService.initializeTransaction(req.user.email, amount, req.user.id);
    return res.json(response);
  }

  async verifyFunding(req: any, res: any) {
    const { reference } = req.query;
    const response = await PaystackWalletService.verifyTransaction(reference);

    if (response.status && response.data.status === "success") {
      const wallet = await Wallet.findOne({ userId: req.user.id });
      if (wallet) {
        wallet.balance += response.data.amount / 100;
        wallet.transactions.push({
          amount: response.data.amount / 100,
          type: "credit",
          description: "Wallet funding",
          reference,
          status: "completed",
          date: new Date(),
        });
        await wallet.save();
      }
    }

    return res.json(response);
  }
}
