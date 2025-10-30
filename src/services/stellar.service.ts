import { contract, Horizon, TransactionBuilder } from "@stellar/stellar-sdk";
import {
  CONTRACT_ADDRESS,
  STELLAR_NETWORK_PASSPHRASE,
  HORIZON_URL,
  SOROBAN_RPC_URL,
} from "../utils/constants";
// import { IKeypair } from "../interfaces/keypair";
// import { IAccountBalanceResponse } from "../interfaces/balance";
// import { AccountBalance } from "../interfaces/account";
// import { ICreateClaimableBalanceResponse } from "../interfaces/claimable-balance";

export class StellarService {
  private horizonUrl: string;
  private server: Horizon.Server;
  private rpcUrl: string;
  private networkPassphrase: string;
  private contractAddress: string;

  constructor() {
    this.horizonUrl = HORIZON_URL as string;
    this.rpcUrl = SOROBAN_RPC_URL as string;
    this.networkPassphrase = STELLAR_NETWORK_PASSPHRASE as string;
    this.contractAddress = CONTRACT_ADDRESS as string;

    this.server = new Horizon.Server(this.horizonUrl, {
      allowHttp: true,
    });
  }

  async buildClient<T = unknown>(publicKey: string): Promise<T> {
    const client = await contract.Client.from({
      contractId: this.contractAddress,
      rpcUrl: this.rpcUrl,
      networkPassphrase: this.networkPassphrase,
      publicKey,
    });

    return client as T;
  }


  async submitTransaction(xdr: string): Promise<string | undefined> {
    try {
      const transaction = TransactionBuilder.fromXDR(
        xdr,
        this.networkPassphrase
      );
      const result = await this.server.submitTransaction(transaction);

      return result.hash;
    } catch (error: unknown) {
      console.error(error);

      const err = error as {
        response?: {
          data?: {
            extras?: {
              result_codes?: unknown;
            };
          };
        };
      };

      if (err.response?.data?.extras?.result_codes) {
        console.error(
          "❌ Error en la transacción:",
          err.response.data.extras.result_codes
        );
      } else {
        console.error("❌ Error general:", error);
      }
    }
  }
  
  environment(): { rpc: string; networkPassphrase: string } {
    return {
      rpc: this.rpcUrl,
      networkPassphrase: this.networkPassphrase,
    };
  }
}

export const stellarService = new StellarService();