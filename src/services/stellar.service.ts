import { Asset, BASE_FEE, Horizon, Keypair, Operation, TransactionBuilder, xdr } from "@stellar/stellar-sdk";
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

private async checkTrustline(
    assetIssuer: string,
    assetCode: string,
    destinationPubKey: string
  ): Promise<boolean> {
    const account = await this.loadAccount(destinationPubKey);
    const balances = account.balances;
    const assetToVerify = new Asset(assetCode, assetIssuer);

    for (const balance of balances) {
      if ("asset_code" in balance) {
        const asset = new Asset(balance.asset_code, balance.asset_issuer);

        if (asset.equals(assetToVerify)) return true;
      }
    }

    return false;
}
  
createTrustlineOperation(
    asset: Asset,
    source: string,
    amount: string
  ): xdr.Operation<Operation.ChangeTrust> {
    const assetLimit = Number(amount) * 100;

    return Operation.changeTrust({
      asset,
      source,
      limit: assetLimit.toString(),
    });
}

async payment(
    senderPubKey: string,
    senderSecret: string,
    receiverPubKey: string,
    receiverSecret: string,
    amount: string,
    assetCode: string
  ): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
    const sourceAccount = await this.loadAccount(senderPubKey);
    const sourceKeypair = Keypair.fromSecret(senderSecret);
    let hasTrustline: boolean = true;

    const asset = this.getAsset(assetCode, receiverPubKey);
    const transactionBuilder = this.transactionBuilder(sourceAccount);
    
    if (asset.code !== "XLM" && asset.issuer !== receiverPubKey) {
      hasTrustline = await this.checkTrustline(
        receiverPubKey,
        assetCode,
        asset.issuer
      );

      if (!hasTrustline) {
        const changeTrustOp = this.createTrustlineOperation(
          asset,
          receiverPubKey,
          amount
        );
        transactionBuilder.addOperation(changeTrustOp);
      }
    }

    const paymentOperation = this.createPaymentOperation(
      amount,
      asset,
      receiverPubKey
    );

    transactionBuilder.addOperation(paymentOperation);

    const transaction = transactionBuilder.setTimeout(180).build();

    transaction.sign(sourceKeypair);

    if (!hasTrustline) {
      const recieveKeypair = Keypair.fromSecret(receiverSecret);
      transaction.sign(recieveKeypair);
    }

    return await this.submitTransaction(transaction);
  }

  async createAsset(
    issuerSecret: string,
    distributorSecret: string,
    assetCode: string,
    amount: string
  ) {
    const issuerKeys = Keypair.fromSecret(issuerSecret);
    const distributorKeys = Keypair.fromSecret(distributorSecret);
    const newAsset = new Asset(assetCode, issuerKeys.publicKey());
    const assetLimit = Number(amount) * 100;

    try {
      const distributorAccount = await this.loadAccount(
        distributorKeys.publicKey()
      );

      // Add new asset to the trustline of the distributor
      // it is not necessary to initialize the asset
      // with the trustline, the account can now receive the asset
      const trustTransaction = new TransactionBuilder(distributorAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(Operation.changeTrust({
            asset: newAsset,
						source: distributorKeys.publicKey(),
						limit: assetLimit.toString(),
		    }))
        .setTimeout(30)
        .build();

      trustTransaction.sign(distributorKeys);
      await this.server.submitTransaction(trustTransaction);

      const issuerAccount = await this.loadAccount(issuerKeys.publicKey());

      // now here I issue the asset to the distributor account
      // these tokens dont have a price, as they are not listed on a DEX
      // basically these are minted tokens (or issued from the issuer to the distributor)
      const issueTransaction = new TransactionBuilder(issuerAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: distributorKeys.publicKey(),
            asset: newAsset,
            amount,
          })
        )
        .setTimeout(30)
        .build();

      issueTransaction.sign(issuerKeys);
      const response= await this.server.submitTransaction(issueTransaction);

      return response;
    } catch (error) {
      console.error("Error creating asset:", error);
      throw error;
    }
  }

}

export const stellarService = new StellarService();