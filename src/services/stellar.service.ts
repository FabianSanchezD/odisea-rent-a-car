import { Asset, BASE_FEE, Horizon, Keypair, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { HORIZON_URL, STELLAR_FRIENDBOT_URL, STELLAR_NETWORK, STELLAR_NETWORK_PASSPHRASE } from "../utils/constants";
import { IKeypair } from "../interfaces/keypair";
import { IAccountBalanceResponse } from "../interfaces/balance";
import { AccountBalance } from "../interfaces/account";

export class StellarService {
  private server: Horizon.Server;
  private network: string;
  private horizonUrl: string;
  private friendBotUrl: string;
  private networkPassphrase: string;

  constructor() {
    this.network = STELLAR_NETWORK as string;
    this.horizonUrl = HORIZON_URL as string;
    this.friendBotUrl = STELLAR_FRIENDBOT_URL as string;
    this.networkPassphrase = STELLAR_NETWORK_PASSPHRASE as string;

    this.server = new Horizon.Server(this.horizonUrl, {
      allowHttp: true,
    });
  }

  createAccount(): IKeypair {
    const pair = Keypair.random();
    return {
        publicKey: pair.publicKey(),
        secretKey: pair.secret(),
    }
  }

  async fundAccount(publicKey: string): Promise<boolean> {
    try {
      if (this.network !== "testnet") {
        throw new Error("Friendbot is only available on testnet");
      }

      const response = await fetch(`${this.friendBotUrl}?addr=${publicKey}`);

      if (!response.ok) {
        return false;
      }

      return true;
    } catch (error: unknown) {
      console.error(error);
      throw new Error(
        `Error when funding account with Friendbot: ${error as string}`
      );
    }
  }

  private async getAccount(address: string): Promise<Horizon.AccountResponse> {
    try {
      return await this.server.loadAccount(address);
    } catch (error) {
      console.error(error);
      throw new Error('Account not found');
}}

async getAccountBalance(publicKey: string): Promise<AccountBalance[]> {
const account =
  await this.getAccount(publicKey);

return account.balances.map((b) => ({
  assetCode:
    b.asset_type === "native"
      ? "XLM"
      : (b as IAccountBalanceResponse).asset_code,

  amount: b.balance,
}));
}

private async loadAccount(address: string): Promise<Horizon.AccountResponse> {
  try {
    return await this.server.loadAccount(address);
  } catch (error) {
    console.error(error);
    throw new Error("Account not found");
  }
}

async payment(
  senderPubKey: string,
  senderSecret: string,
  receiverPubKey: string,
  amount: string
): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
  const sourceAccount = await this.loadAccount(senderPubKey);
  const sourceKeypair = Keypair.fromSecret(senderSecret);

  const transaction = new TransactionBuilder(sourceAccount, {
    networkPassphrase: this.networkPassphrase,
    fee: BASE_FEE,
  })
    .addOperation(
      Operation.payment({
        amount,
        asset: Asset.native(),
        destination: receiverPubKey,
      })
    )
    .setTimeout(180)
    .build();

  transaction.sign(sourceKeypair);

  try {
    const result = await this.server.submitTransaction(transaction);

    return result;

  } catch (error: any) {
    console.error(error);
    if (error.response?.data?.extras?.result_codes) {
      console.error(
        "❌ Error en la transacción:",
        error.response.data.extras.result_codes
      );
    } else {
      console.error("❌ Error general:", error);
    }
  }
}

}

export const stellarService = new StellarService();