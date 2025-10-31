import { useMemo, useState } from "react";
import Modal from "./Modal";

interface AdminWithdrawModalProps {
  maxAmountStroops: number;
  onCancel: () => void;
  onConfirm: (amountStroops: number) => Promise<void>;
}

export default function AdminWithdrawModal({
  maxAmountStroops,
  onCancel,
  onConfirm,
}: AdminWithdrawModalProps) {
  const [amountXlm, setAmountXlm] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const maxAmountXlm = useMemo(() => maxAmountStroops / 1_0000000, [maxAmountStroops]);

  const handleSubmit = async () => {
    const parsed = Number(amountXlm);
    if (!isFinite(parsed) || parsed <= 0) return;
    const stroops = Math.floor(parsed * 1_0000000);
    if (stroops > maxAmountStroops) return;
    setSubmitting(true);
    try {
      await onConfirm(stroops);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Withdraw Commisions" closeModal={onCancel}>
      <div className="p-4 md:p-5 space-y-5">
        <div>
          <p className="text-sm text-slate-600">
            Available: <span className="font-semibold">{maxAmountXlm.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 7 })} XLM</span>
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Amount (XLM)</label>
          <input
            type="number"
            min={0}
            step="0.000001"
            value={amountXlm}
            onChange={(e) => setAmountXlm(e.target.value)}
            placeholder="0.000000"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors font-mono text-lg"
          />
          {amountXlm && Number(amountXlm) * 1_0000000 > maxAmountStroops && (
            <p className="text-red-600 text-sm mt-1">Amount exceeds available.</p>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting ? "Withdrawing..." : "Withdraw"}
          </button>
        </div>
      </div>
    </Modal>
  );
}


