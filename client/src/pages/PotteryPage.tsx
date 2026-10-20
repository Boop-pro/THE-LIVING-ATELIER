import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PotteryItem, PotteryGlaze } from '../types';
import { Flame, Sparkles, Calendar, Clock, CheckCircle, ArrowRight, Layers, ShieldCheck } from 'lucide-react';

const GLAZE_COLOR_MAP: Record<string, string> = {
  'g-01': '#C72C35', // Kumkum Red
  'g-02': '#EAB308', // Haldi Yellow
  'g-03': '#4D7C0F', // Mehendi Green
  'g-04': '#1D4ED8', // Indigo Blue
  'g-05': '#D4A373', // Sandalwood Beige
  'g-06': '#27272A', // Charcoal Black
};

const potteryCommissionSchema = z.object({
  potteryItemId: z.string().min(1, 'Please select a pottery item form'),
  potteryGlazeId: z.string().min(1, 'Please select a glaze finish'),
  quantity: z.number().int().min(1, 'Minimum quantity is 1 piece').max(12, 'Maximum batch is 12 pieces per order'),
  neededByDate: z.string().min(1, 'Please select your needed-by date'),
  notes: z.string().optional(),
});

type PotteryFormData = z.infer<typeof potteryCommissionSchema>;

export const PotteryPage: React.FC = () => {
  const [items, setItems] = useState<PotteryItem[]>([]);
  const [glazes, setGlazes] = useState<PotteryGlaze[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commissionSuccessModal, setCommissionSuccessModal] = useState<any | null>(null);

  const { isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Helper date: minimum 14 calendar days away
  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() + 14);
  const minDateStr = minDateObj.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PotteryFormData>({
    resolver: zodResolver(potteryCommissionSchema),
    defaultValues: {
      potteryItemId: 'i-01',
      potteryGlazeId: 'g-01',
      quantity: 4,
      neededByDate: minDateStr,
      notes: '',
    },
  });

  const selectedItemId = watch('potteryItemId');
  const selectedGlazeId = watch('potteryGlazeId');
  const selectedQuantity = watch('quantity') || 1;
  const selectedDate = watch('neededByDate');

  const activeItem = items.find((i) => i.id === selectedItemId);
  const activeGlaze = glazes.find((g) => g.id === selectedGlazeId);

  useEffect(() => {
    Promise.all([api.getPotteryItems(), api.getPotteryGlazes()])
      .then(([itemsRes, glazesRes]) => {
        if (itemsRes.success) setItems(itemsRes.items);
        if (glazesRes.success) setGlazes(glazesRes.glazes);
      })
      .catch((err) => console.error('Error fetching pottery catalogs:', err))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: PotteryFormData) => {
    if (!isAuthenticated) {
      toastError('Sign In Required', 'Please log in to commission custom pottery.');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createPotteryRequest({
        potteryItemId: data.potteryItemId,
        potteryGlazeId: data.potteryGlazeId,
        quantity: data.quantity,
        neededByDate: data.neededByDate,
        notes: data.notes,
      });

      success('Commission Submitted!', 'Your custom pottery request is now scheduled for studio review.');
      setCommissionSuccessModal(res.request);
    } catch (err: any) {
      toastError('Submission Error', err.message || 'Could not submit pottery commission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header Banner */}
      <div className="bg-atelier-lavender border-2 border-atelier-ink rounded-3xl p-8 sm:p-14 shadow-brutal relative overflow-hidden">
        <div className="max-w-2xl space-y-4">
          <span className="art-badge bg-atelier-chartreuse text-atelier-ink">
            Hand-Thrown Studio Ceramics
          </span>
          <h1 className="font-display font-black text-4xl sm:text-6xl text-atelier-ink tracking-tight leading-none">
            COMMISSION BESPOKE POTTERY.
          </h1>
          <p className="font-body text-base sm:text-lg text-atelier-ink/90 leading-relaxed font-medium">
            Hand-shaped on potter’s wheels using clay sourced from the banks of local rivers and fired in wood kilns. Pick a traditional form, choose your mineral glaze, and specify your batch quantity.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white font-display font-bold text-xs border border-atelier-ink">
              <Clock className="w-3.5 h-3.5 text-atelier-tomato" />
              14-Day Wheel &amp; Kiln Lead Time
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white font-display font-bold text-xs border border-atelier-ink">
              <Flame className="w-3.5 h-3.5 text-atelier-chartreuse-hover" />
              1 to 12 Pieces Per Commission
            </span>
          </div>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Form Column */}
        <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-atelier-ink shadow-brutal p-8 space-y-8">
          <div>
            <h2 className="font-display font-black text-2xl text-atelier-ink">
              Design Your Ceramic Commission
            </h2>
            <p className="text-sm text-atelier-muted font-body mt-1">
              Select your traditional pottery vessel form and choose from our authentic mineral glazes.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* 1. Item Selection Grid */}
            <div className="space-y-3">
              <label className="block font-display font-bold text-sm text-atelier-ink">
                1. Select Ceramic Vessel Form
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((item) => {
                  const isSelected = selectedItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setValue('potteryItemId', item.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-atelier-ink bg-atelier-chartreuse/30 shadow-brutal -translate-y-0.5'
                          : 'border-atelier-border bg-atelier-cream hover:border-atelier-ink hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-sm text-atelier-ink">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-atelier-muted uppercase">
                          {item.id}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.potteryItemId && (
                <p className="text-xs text-atelier-tomato font-bold">{errors.potteryItemId.message}</p>
              )}
            </div>

            {/* 2. Glaze Selection Grid */}
            <div className="space-y-3">
              <label className="block font-display font-bold text-sm text-atelier-ink">
                2. Select Natural Mineral Glaze
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {glazes.map((glaze) => {
                  const isSelected = selectedGlazeId === glaze.id;
                  const colorHex = GLAZE_COLOR_MAP[glaze.id] || '#A8A29E';

                  return (
                    <div
                      key={glaze.id}
                      onClick={() => setValue('potteryGlazeId', glaze.id)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-atelier-ink bg-atelier-lavender shadow-brutal -translate-y-0.5'
                          : 'border-atelier-border bg-atelier-cream hover:border-atelier-ink hover:bg-white'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border-2 border-atelier-ink flex-shrink-0"
                        style={{ backgroundColor: colorHex }}
                      />
                      <span className="font-display font-bold text-xs text-atelier-ink truncate">
                        {glaze.name}
                      </span>
                    </div>
                  );
                })}
              </div>
              {errors.potteryGlazeId && (
                <p className="text-xs text-atelier-tomato font-bold">{errors.potteryGlazeId.message}</p>
              )}
            </div>

            {/* 3. Quantity Stepper */}
            <div className="space-y-2 bg-atelier-cream p-5 rounded-2xl border-2 border-atelier-ink">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-display font-bold text-sm text-atelier-ink">
                    3. Batch Quantity (1 to 12 Pieces)
                  </label>
                  <p className="text-xs text-atelier-muted font-body">
                    Handmade in single kiln batches
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-full border-2 border-atelier-ink">
                  <button
                    type="button"
                    onClick={() => setValue('quantity', Math.max(1, selectedQuantity - 1))}
                    disabled={selectedQuantity <= 1}
                    className="w-8 h-8 rounded-full border border-atelier-ink flex items-center justify-center font-bold text-lg hover:bg-atelier-lavender disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="font-display font-black text-lg w-8 text-center">
                    {selectedQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setValue('quantity', Math.min(12, selectedQuantity + 1))}
                    disabled={selectedQuantity >= 12}
                    className="w-8 h-8 rounded-full border border-atelier-ink flex items-center justify-center font-bold text-lg hover:bg-atelier-lavender disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
              {errors.quantity && (
                <p className="text-xs text-atelier-tomato font-bold">{errors.quantity.message}</p>
              )}
            </div>

            {/* 4. Needed-By Date */}
            <div className="space-y-2">
              <label className="block font-display font-bold text-sm text-atelier-ink">
                4. Needed-By Date (At Least 14 Days Away)
              </label>
              <input
                type="date"
                min={minDateStr}
                {...register('neededByDate')}
                className="w-full p-3.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-atelier-chartreuse"
              />
              <p className="text-xs text-atelier-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-atelier-lavender-dark" />
                Required for air-drying, bisque firing, glazing, and wood-kiln reduction.
              </p>
              {errors.neededByDate && (
                <p className="text-xs text-atelier-tomato font-bold">{errors.neededByDate.message}</p>
              )}
            </div>

            {/* 5. Custom Specifications / Notes */}
            <div className="space-y-2">
              <label className="block font-display font-bold text-sm text-atelier-ink">
                5. Custom Inscriptions or Texture Requests (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Carved initials, rough textured bottom, dripped rim glaze..."
                {...register('notes')}
                className="w-full p-3 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-atelier-chartreuse"
              />
            </div>

            {/* Submit Commission Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-base shadow-brutal-lg"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-atelier-ink border-t-transparent animate-spin" />
                  Submitting Commission Request...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Flame className="w-5 h-5 text-atelier-tomato" />
                  Request Custom Pottery Commission
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-atelier-cream rounded-3xl border-2 border-atelier-ink shadow-brutal-lg p-8 space-y-6 sticky top-28">
            <div className="flex items-center justify-between border-b-2 border-atelier-ink/20 pb-4">
              <h3 className="font-display font-black text-xl text-atelier-ink">
                COMMISSION SUMMARY
              </h3>
              <Sparkles className="w-5 h-5 text-atelier-chartreuse-hover" />
            </div>

            <div className="space-y-4 text-sm font-body">
              <div className="flex justify-between items-center">
                <span className="text-atelier-muted">Selected Vessel</span>
                <span className="font-display font-bold text-atelier-ink">
                  {activeItem ? activeItem.name : '—'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-atelier-muted">Mineral Glaze</span>
                <div className="flex items-center gap-2">
                  {activeGlaze && (
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-atelier-ink"
                      style={{ backgroundColor: GLAZE_COLOR_MAP[activeGlaze.id] || '#000' }}
                    />
                  )}
                  <span className="font-display font-bold text-atelier-ink">
                    {activeGlaze ? activeGlaze.name : '—'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-atelier-muted">Total Batch Quantity</span>
                <span className="font-display font-black text-lg text-atelier-ink bg-atelier-chartreuse px-2.5 py-0.5 rounded-lg border border-atelier-ink">
                  {selectedQuantity} pcs
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-atelier-muted">Needed-By Deadline</span>
                <span className="font-display font-bold text-atelier-ink">
                  {selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-atelier-ink/20 bg-white p-4 rounded-2xl border-2 border-atelier-ink space-y-2">
              <p className="font-bold text-xs text-atelier-ink flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-atelier-chartreuse-hover" />
                Review &amp; Edit Policy
              </p>
              <p className="text-xs text-atelier-muted leading-relaxed font-body">
                Our ceramic master reviews every request for kiln scheduling. You can freely edit or cancel your request from your dashboard at any time while it remains in <b>requested</b> status.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {commissionSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-atelier-ink/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border-4 border-atelier-ink shadow-brutal-xl max-w-md w-full p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-atelier-lavender border-2 border-atelier-ink shadow-brutal flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-atelier-ink" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-black text-2xl text-atelier-ink">
                Commission Received!
              </h3>
              <p className="text-sm text-atelier-muted font-body leading-relaxed">
                Your custom request for{' '}
                <span className="font-bold text-atelier-ink">
                  {commissionSuccessModal.quantity}x {commissionSuccessModal.item?.name}
                </span>{' '}
                with{' '}
                <span className="font-bold text-atelier-ink">
                  {commissionSuccessModal.glaze?.name}
                </span>{' '}
                has been submitted with status{' '}
                <span className="art-badge bg-atelier-chartreuse text-atelier-ink">requested</span>.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCommissionSuccessModal(null)}
                className="btn-outline flex-1"
              >
                Close
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary flex-1"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
