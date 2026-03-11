import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, CreditCard, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money';
  label: string;
  last4?: string | null;
  phone?: string | null;
  is_default?: number | boolean;
}

export default function SettingsPaymentMethods() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.parseResponse<{ data?: any }>(await api.get('/wallet/payment-methods'));
      const list = Array.isArray(res.data) ? res.data : (res.data?.payment_methods || res.data?.methods || []);
      setMethods(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load payment methods');
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const setDefault = async (id: string) => {
    try {
      await api.parseResponse(await api.put(`/wallet/payment-methods/${id}/default`, {}));
      toast.success('Default method updated');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update default');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    try {
      await api.parseResponse(await api.del(`/wallet/payment-methods/${id}`));
      toast.success('Payment method removed');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove method');
    }
  };

  return (
    <div className="w-full">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment methods</h1>
      <p className="text-sm text-gray-500 mb-6">Manage the accounts you can withdraw to.</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : methods.length === 0 ? (
          <div className="px-5 py-10 text-sm text-gray-500">
            You don&apos;t have any payment methods yet. Add one from your <button
              onClick={() => navigate('/wallet')}
              className="text-primary font-semibold hover:underline"
            >
              Wallet
            </button>{' '}
            page when you withdraw.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {methods.map((m) => {
              const isDef = !!m.is_default;
              return (
                <div key={m.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                    {m.type === 'card' ? (
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.label}</p>
                    <p className="text-xs text-gray-500">
                      {m.type === 'mobile_money'
                        ? (m.phone || 'Mobile money')
                        : (m.last4 ? `Card •••• ${m.last4}` : 'Card')}
                    </p>
                  </div>
                  {isDef ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Default
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefault(m.id)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Make default
                    </button>
                  )}
                  <button
                    onClick={() => remove(m.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

