import { useMemo, useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, TrendingUp, Clock, CreditCard, KeyRound, Plus } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Balance {
  available: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  reference?: string;
  created_at: string;
  fee?: number;
  metadata?: { description?: string; purpose?: string };
  counterparty?: { name?: string; phone?: string };
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money';
  label: string;
  last4?: string | null;
  phone?: string | null;
  provider?: string | null;
  card_expiry?: string | null;
  card_name?: string | null;
  is_default?: number | boolean;
  created_at?: string;
}

const TX_COLORS: Record<string, string> = {
  credit:     'text-green-600 bg-green-50',
  debit:      'text-red-500 bg-red-50',
  withdrawal: 'text-orange-500 bg-orange-50',
  deposit:    'text-green-600 bg-green-50',
  refund:     'text-blue-500 bg-blue-50',
  fee:        'text-gray-500 bg-gray-50',
};

const STATUS_BADGE: Record<string, string> = {
  completed:  'bg-green-100 text-green-700',
  success:    'bg-green-100 text-green-700',
  pending:    'bg-amber-100 text-amber-700',
  failed:     'bg-red-100 text-red-700',
  reversed:   'bg-gray-100 text-gray-600',
};

const PHONE_CODES = [
  { iso: 'UG', flag: '🇺🇬', dial: '+256', label: 'Uganda' },
  { iso: 'KE', flag: '🇰🇪', dial: '+254', label: 'Kenya' },
  { iso: 'TZ', flag: '🇹🇿', dial: '+255', label: 'Tanzania' },
  { iso: 'RW', flag: '🇷🇼', dial: '+250', label: 'Rwanda' },
];

function fmt(amount: number, currency: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${currency} —`;
  return `${currency} ${n.toLocaleString()}`;
}

export default function Wallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [pinStatus, setPinStatus] = useState<{ has_pin: boolean; status?: string; retries?: number } | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [withdrawStep, setWithdrawStep] = useState<1 | 2>(1);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

  const [pinOpen, setPinOpen] = useState(false);
  const [settingPin, setSettingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [pmOpen, setPmOpen] = useState(false);
  const [addingPm, setAddingPm] = useState(false);
  const [pmType, setPmType] = useState<'mobile_money' | 'card'>('mobile_money');
  const [pmLabel, setPmLabel] = useState('');
  const [pmPhone, setPmPhone] = useState('');
  const [pmDial, setPmDial] = useState(PHONE_CODES[0].dial);
  const [pmLast4, setPmLast4] = useState('');
  const [pmCardExpiry, setPmCardExpiry] = useState('');

  useEffect(() => {
    api.get('/wallet/balance')
      .then((r) => api.parseResponse<{ data?: any }>(r))
      .then((res) => {
        const d = res.data ?? {};
        // Backend returns { balance, currency }. Older UI shape used { available }.
        const available = Number(d.available ?? d.balance ?? 0) || 0;
        const currency = String(d.currency ?? 'UGX');
        setBalance({ available, currency });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get('/wallet/transactions')
      .then((r) => api.parseResponse<{ data?: Transaction[] | { transactions?: Transaction[] } }>(r))
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : ((res.data as any)?.transactions || []);
        setTransactions(list);
      })
      .catch(() => {})
      .finally(() => setTxLoading(false));

    api.get('/wallet/pin/status')
      .then((r) => api.parseResponse<{ data?: any }>(r))
      .then((res) => {
        const d = res.data ?? {};
        setPinStatus({ has_pin: !!d.has_pin, status: d.status, retries: d.retries });
      })
      .catch(() => setPinStatus({ has_pin: false }));

    api.get('/wallet/payment-methods')
      .then((r) => api.parseResponse<{ data?: any }>(r))
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.payment_methods || res.data?.methods || []);
        setPaymentMethods(Array.isArray(list) ? list : []);
      })
      .catch(() => setPaymentMethods([]));
  }, []);

  const currency = balance?.currency || 'UGX';
  const totalCredits = useMemo(
    () => transactions.filter((t) => ['credit', 'deposit'].includes((t.type || '').toLowerCase())).reduce((s, t) => s + Number(t.amount || 0), 0),
    [transactions]
  );
  const totalDebits = useMemo(
    () => transactions.filter((t) => ['debit', 'withdrawal', 'withdraw'].includes((t.type || '').toLowerCase())).reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0),
    [transactions]
  );

  const defaultMethod = useMemo(() => {
    const list = paymentMethods || [];
    return list.find((m) => !!m.is_default) || list[0] || null;
  }, [paymentMethods]);

  const closeAllModals = () => {
    setWithdrawOpen(false);
    setPinOpen(false);
    setPmOpen(false);
  };

  const refreshWallet = async () => {
    try {
      const bal = await api.parseResponse<{ data?: any }>(await api.get('/wallet/balance'));
      const d = bal.data ?? {};
      const available = Number(d.available ?? d.balance ?? 0) || 0;
      const currency = String(d.currency ?? 'UGX');
      setBalance({ available, currency });
    } catch {}
    try {
      const tx = await api.parseResponse<{ data?: any }>(await api.get('/wallet/transactions'));
      const list = Array.isArray(tx.data) ? tx.data : (tx.data?.transactions || []);
      setTransactions(Array.isArray(list) ? list : []);
    } catch {}
  };

  const refreshPaymentMethods = async () => {
    try {
      const res = await api.parseResponse<{ data?: any }>(await api.get('/wallet/payment-methods'));
      const list = Array.isArray(res.data) ? res.data : (res.data?.payment_methods || res.data?.methods || []);
      setPaymentMethods(Array.isArray(list) ? list : []);
    } catch {
      setPaymentMethods([]);
    }
  };

  const refreshPinStatus = async () => {
    try {
      const res = await api.parseResponse<{ data?: any }>(await api.get('/wallet/pin/status'));
      const d = res.data ?? {};
      setPinStatus({ has_pin: !!d.has_pin, status: d.status, retries: d.retries });
    } catch {
      setPinStatus({ has_pin: false });
    }
  };

  const submitWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const method = selectedMethodId
      ? paymentMethods.find((m) => m.id === selectedMethodId)
      : defaultMethod;
    if (!method) {
      toast.error('Choose a payment method first');
      return;
    }
    const phone = (method.phone || '').trim();
    if (!phone) {
      toast.error('Selected payment method has no phone number');
      return;
    }
    if (pinStatus?.has_pin && !/^\d{4,6}$/.test(withdrawPin.trim())) {
      toast.error('Enter your 4–6 digit wallet PIN');
      return;
    }
    setWithdrawing(true);
    try {
      await api.parseResponse(await api.post('/wallet/withdraw', {
        method: 'mobile_money',
        amount,
        phone,
        currency,
        pin: pinStatus?.has_pin ? withdrawPin.trim() : undefined,
      }));
      toast.success('Withdrawal submitted');
      closeAllModals();
      setWithdrawAmount('');
      setWithdrawPin('');
      setSelectedMethodId('');
      setWithdrawStep(1);
      await refreshWallet();
    } catch (e: any) {
      toast.error(e?.message || 'Withdrawal failed');
      await refreshPinStatus();
    } finally {
      setWithdrawing(false);
    }
  };

  const submitPin = async () => {
    const p = newPin.trim();
    if (!/^\d{4,6}$/.test(p)) {
      toast.error('PIN must be 4–6 digits');
      return;
    }
    if (p !== confirmPin.trim()) {
      toast.error('PINs do not match');
      return;
    }
    setSettingPin(true);
    try {
      await api.parseResponse(await api.post('/wallet/pin', { pin: p }));
      toast.success('Wallet PIN set');
      setPinOpen(false);
      setNewPin('');
      setConfirmPin('');
      await refreshPinStatus();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to set PIN');
    } finally {
      setSettingPin(false);
    }
  };

  const submitPaymentMethod = async () => {
    if (!pmLabel.trim()) {
      toast.error('Add a label (e.g. MTN MoMo)');
      return;
    }
    if (pmType === 'mobile_money' && !pmPhone.trim()) {
      toast.error('Enter a mobile money phone number');
      return;
    }
    if (pmType === 'card' && !/^\d{4}$/.test(pmLast4.trim())) {
      toast.error('Enter last 4 digits of card');
      return;
    }
    const phone =
      pmType === 'mobile_money'
        ? `${pmDial}${pmPhone.trim().replace(/\D/g, '')}`
        : undefined;

    setAddingPm(true);
    try {
      await api.parseResponse(await api.post('/wallet/payment-methods', {
        type: pmType,
        label: pmLabel.trim(),
        phone,
        last4: pmType === 'card' ? pmLast4.trim() : undefined,
        card_name: user?.full_name || undefined,
        card_expiry: pmType === 'card' ? pmCardExpiry.trim() : undefined,
      }));
      toast.success('Payment method added');
      setPmOpen(false);
      setPmLabel('');
      setPmPhone('');
      setPmLast4('');
      setPmCardExpiry('');
      await refreshPaymentMethods();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add payment method');
    } finally {
      setAddingPm(false);
    }
  };

  // Payment method listing & management now live in SettingsPaymentMethods.

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your earnings and transaction history</p>
      </div>

      {/* Balance cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {/* Main balance */}
        <div className="sm:col-span-2 bg-gradient-to-br from-primary-dark via-primary to-[#3daa4a] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/8 pointer-events-none" />
          <div className="absolute bottom-0 right-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <WalletIcon className="w-4 h-4 text-white/60" />
              <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Available Balance</p>
            </div>
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mt-2" />
            ) : (
              <p className="text-3xl font-bold mt-1">{balance ? fmt(balance.available, currency) : '—'}</p>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-gray-500">Total Earned</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{fmt(totalCredits, currency)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-xs text-gray-500">Total Withdrawn</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{fmt(totalDebits, currency)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => {
            setWithdrawOpen(true);
            setWithdrawStep(1);
            setSelectedMethodId(defaultMethod?.id || '');
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition"
        >
          <ArrowUpRight className="w-4 h-4" /> Withdraw
        </button>
        <button
          onClick={() => setPmOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition"
        >
          <CreditCard className="w-4 h-4" /> Payment methods
        </button>
        <button
          onClick={() => setPinOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition"
        >
          <KeyRound className="w-4 h-4" /> {pinStatus?.has_pin ? 'Update wallet PIN' : 'Set wallet PIN'}
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition">
          <TrendingUp className="w-4 h-4" /> View Statement
        </button>
      </div>

      {/* Withdraw side sheet */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={closeAllModals}>
          <div className="h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-100 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-widest">Withdraw</p>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  {withdrawStep === 1 ? 'Select amount & account' : 'Confirm withdrawal'}
                </h3>
              </div>
              <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>

            {withdrawStep === 1 ? (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({currency})</label>
                  <input
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="e.g. 50000"
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Withdraw to</label>
                  {paymentMethods.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      You don&apos;t have any payment methods yet. Add one below to withdraw your funds.
                    </div>
                  ) : (
                    <select
                      value={selectedMethodId}
                      onChange={(e) => setSelectedMethodId(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white cursor-pointer"
                    >
                      <option value="">Select payout account…</option>
                      {paymentMethods.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label} {m.type === 'mobile_money' && m.phone ? `• ${m.phone}` : ''}
                          {m.is_default ? ' (default)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {pinStatus?.has_pin ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wallet PIN</label>
                    <input
                      value={withdrawPin}
                      onChange={(e) => setWithdrawPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      placeholder="4–6 digits"
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
                    For security, set a wallet PIN before withdrawing.
                    <button onClick={() => { setWithdrawOpen(false); setPinOpen(true); }} className="ml-2 font-semibold text-amber-900 underline">Set PIN</button>
                  </div>
                )}

                {/* Inline add payment method */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Add payout account</p>
                  <button
                    onClick={() => {
                      setPmType('mobile_money');
                      setPmLabel('');
                      setPmPhone('');
                      setPmLast4('');
                      setPmCardExpiry('');
                      setPmOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add payment method
                  </button>
                  <p className="text-[11px] text-gray-500 mt-1">
                    You can only withdraw to saved payment methods.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <div className="rounded-xl bg-surface border border-gray-100 p-4 text-sm">
                  <p className="font-semibold text-gray-800 mb-2">Review details</p>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-semibold text-gray-900">{fmt(Number(withdrawAmount || 0), currency)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-500">To</span>
                    <span className="font-semibold text-gray-900">
                      {(() => {
                        const m = paymentMethods.find((pm) => pm.id === selectedMethodId) || defaultMethod;
                        if (!m) return '—';
                        return `${m.label}${m.phone ? ` • ${m.phone}` : ''}`;
                      })()}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Withdrawals are processed via mobile money. Make sure your phone is on and able to receive payments.
                </p>
              </div>
            )}

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (withdrawStep === 1) closeAllModals();
                  else setWithdrawStep(1);
                }}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                {withdrawStep === 1 ? 'Cancel' : 'Back'}
              </button>
              {withdrawStep === 1 ? (
                <button
                  onClick={() => setWithdrawStep(2)}
                  disabled={
                    !withdrawAmount.trim() ||
                    (!selectedMethodId && !defaultMethod) ||
                    (pinStatus?.has_pin && !withdrawPin.trim())
                  }
                  className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={submitWithdraw}
                  disabled={withdrawing}
                  className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  {withdrawing ? 'Submitting…' : 'Confirm & withdraw'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PIN modal */}
      {pinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeAllModals}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{pinStatus?.has_pin ? 'Update wallet PIN' : 'Set wallet PIN'}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Used to confirm withdrawals</p>
              </div>
              <button onClick={() => setPinOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New PIN</label>
                <input
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="4–6 digits"
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
                <input
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="Repeat PIN"
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white"
                />
              </div>
              {pinStatus?.retries ? (
                <p className="text-[11px] text-gray-500">Failed attempts: {pinStatus.retries}</p>
              ) : null}
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setPinOpen(false)} className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={submitPin}
                disabled={settingPin}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
              >
                {settingPin ? 'Saving…' : 'Save PIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment methods modal */}
      {pmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeAllModals}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Payment methods</h3>
                <p className="text-xs text-gray-500 mt-0.5">Used for withdrawals and payouts</p>
              </div>
              <button onClick={() => setPmOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <div className="mt-4 grid md:grid-cols-5 gap-4">
              {/* List */}
              <div className="md:col-span-3">
                {/* Intentionally empty – list of methods now lives in Settings › Payment methods */}
                <div className="text-sm text-gray-500 px-1 py-2">
                  Manage your saved payment methods from <span className="font-semibold">Settings &gt; Payment methods</span>.
                </div>
              </div>

              {/* Add form */}
              <div className="md:col-span-2">
                <div className="rounded-2xl border border-gray-100 bg-surface p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3">Add a method</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                      <select
                        value={pmType}
                        onChange={(e) => setPmType(e.target.value as any)}
                        className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white"
                      >
                        <option value="mobile_money">Mobile Money</option>
                        <option value="card">Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Label</label>
                      <input
                        value={pmLabel}
                        onChange={(e) => setPmLabel(e.target.value)}
                        placeholder={pmType === 'mobile_money' ? 'e.g. MTN MoMo' : 'e.g. Visa card'}
                        className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white"
                      />
                    </div>
                    {pmType === 'mobile_money' ? (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                        <div className="flex gap-2">
                          <select
                            value={pmDial}
                            onChange={(e) => setPmDial(e.target.value)}
                            className="px-2 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none bg-white cursor-pointer shrink-0"
                            style={{ minWidth: 108 }}
                          >
                            {PHONE_CODES.map((c) => (
                              <option key={c.iso} value={c.dial}>{c.flag} {c.dial}</option>
                            ))}
                          </select>
                          <input
                            value={pmPhone}
                            onChange={(e) => setPmPhone(e.target.value)}
                            placeholder="77 000 0000"
                            className="flex-1 px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Last 4 digits</label>
                          <input
                            value={pmLast4}
                            onChange={(e) => setPmLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            inputMode="numeric"
                            placeholder="1234"
                            className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry (optional)</label>
                          <input
                            value={pmCardExpiry}
                            onChange={(e) => setPmCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition bg-white"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Account name</label>
                      <input
                        value={user?.full_name || ''}
                        readOnly
                        disabled
                        placeholder="Your name"
                        className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">This is linked to your Canoe Health profile and cannot be changed.</p>
                    </div>

                    <button
                      onClick={submitPaymentMethod}
                      disabled={addingPm}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
                    >
                      <Plus className="w-4 h-4" /> {addingPm ? 'Adding…' : 'Add method'}
                    </button>
                    <p className="text-[11px] text-gray-500">
                      Note: only mobile money withdrawals are currently supported.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Transaction History</h2>
          <span className="text-xs text-gray-400">{transactions.length} transactions</span>
        </div>

        {txLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <WalletIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => {
              const type = (tx.type || '').toLowerCase();
              const status = (tx.status || '').toLowerCase();
              const isCredit = ['credit', 'deposit', 'refund'].includes(type);
              const colorCls = TX_COLORS[type] || 'text-gray-600 bg-gray-50';
              return (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition">
                  {/* Type icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorCls}`}>
                    {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 capitalize">
                      {tx.metadata?.description || tx.metadata?.purpose || type}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {tx.counterparty?.name && <span className="text-xs text-gray-500">{tx.counterparty.name}</span>}
                      {tx.reference && <span className="text-[10px] text-gray-400 font-mono">{tx.reference}</span>}
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Amount + status */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                      {isCredit ? '+' : '-'}{fmt(Math.abs(Number(tx.amount || 0)), tx.currency || currency)}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-500'}`}>
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
