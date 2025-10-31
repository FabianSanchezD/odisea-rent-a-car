import { CarsList } from "../components/CarList";
import { CreateCarForm } from "../components/CreateCarForm";
import AdminWithdrawModal from "../components/AdminWithdrawModal";
import { useState } from "react";
import StellarExpertLink from "../components/StellarExpertLink";
import useModal from "../hooks/useModal";
import { ICar } from "../interfaces/car";
import { CarStatus } from "../interfaces/car-status";
import { IRentACarContract } from "../interfaces/contract";
import { CreateCar } from "../interfaces/create-car";
import { UserRole } from "../interfaces/user-role";
import { useStellarAccounts } from "../providers/StellarAccountProvider";
import { stellarService } from "../services/stellar.service";
import { walletService } from "../services/wallet.service";
import { ONE_XLM_IN_STROOPS } from "../utils/xlm-in-stroops";

export default function Dashboard() {
  const { hashId, cars, walletAddress, setCars, setHashId, selectedRole } =
    useStellarAccounts();
  const { showModal, openModal, closeModal } = useModal();
  const withdrawModal = useModal();
  const [availableCommission, setAvailableCommission] = useState<number>(0);

  const handleCreateCar = async (formData: CreateCar) => {
    const { brand, model, color, passengers, pricePerDay, ac, ownerAddress } =
      formData;
    const contractClient =
      await stellarService.buildClient<IRentACarContract>(walletAddress);

    const addCarResult = await contractClient.add_car({
      owner: ownerAddress,
      price_per_day: pricePerDay * ONE_XLM_IN_STROOPS,
    });
    const xdr = addCarResult.toXDR();

    const signedTx = await walletService.signTransaction(xdr);
    const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);

    const newCar: ICar = {
      brand,
      model,
      color,
      passengers,
      pricePerDay,
      ac,
      ownerAddress,
      status: CarStatus.AVAILABLE,
    };

    setCars((prevCars) => [...prevCars, newCar]);
    setHashId(txHash as string);
    closeModal();
  };

  const openWithdrawCommissions = async () => {
    const contractClient = await stellarService.buildClient<IRentACarContract>(walletAddress);
    const commission = await contractClient.get_admin_commission();
    setAvailableCommission(commission || 0);
    withdrawModal.openModal();
  };

  const confirmWithdrawCommissions = async (amountStroops: number) => {
    const contractClient = await stellarService.buildClient<IRentACarContract>(walletAddress);
    const result = await contractClient.payout_admin({
      admin: walletAddress, // alternative to get_admin: pass the connected admin wallet
      amount: amountStroops,
    });
    const xdr = result.toXDR();
    const signedTx = await walletService.signTransaction(xdr);
    const txHash = await stellarService.submitTransaction(signedTx.signedTxXdr);
    setHashId(txHash as string);
    withdrawModal.closeModal();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" data-test="dashboard-title">
          Cars Catalog
        </h1>
        {selectedRole === UserRole.ADMIN && (
          <div className="flex items-center gap-3">
            <button
              onClick={openModal}
              className="group px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none cursor-pointer"
            >
              <span className="flex items-center gap-2">Add Car</span>
            </button>
            <button
              onClick={() => void openWithdrawCommissions()}
              className="group px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none cursor-pointer"
            >
              <span className="flex items-center gap-2">Withdraw Commisions</span>
            </button>
          </div>
        )}
      </div>

      {cars && <CarsList cars={cars} />}

      {showModal && (
        <CreateCarForm onCreateCar={handleCreateCar} onCancel={closeModal} />
      )}

      {hashId && <StellarExpertLink url={hashId} />}

      {withdrawModal.showModal && (
        <AdminWithdrawModal
          maxAmountStroops={availableCommission}
          onCancel={withdrawModal.closeModal}
          onConfirm={confirmWithdrawCommissions}
        />
      )}
    </div>
  );
}