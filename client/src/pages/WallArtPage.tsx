import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Paintbrush, Calendar, MapPin, Calculator, ShieldCheck, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const wallBookingFormSchema = z.object({
  bookingDate: z.string().min(1, 'Please select a service date'),
  wallSizeSqFt: z.number().min(10, 'Minimum wall size is 10 sq.ft').max(500, 'Maximum wall size is 500 sq.ft'),
  serviceAddress: z.string().min(5, 'Service address must be at least 5 characters long'),
  notes: z.string().optional(),
});

type WallBookingFormData = z.infer<typeof wallBookingFormSchema>;

export const WallArtPage: React.FC = () => {
  const [ratePerSqFt, setRatePerSqFt] = useState<number>(150);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<any | null>(null);

  const { isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Helper date calculations for 7-90 days calendar limits
  const today = new Date();
  const minDateObj = new Date();
  minDateObj.setDate(today.getDate() + 7);
  const minDateStr = minDateObj.toISOString().split('T')[0];

  const maxDateObj = new Date();
  maxDateObj.setDate(today.getDate() + 90);
  const maxDateStr = maxDateObj.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WallBookingFormData>({
    resolver: zodResolver(wallBookingFormSchema),
    defaultValues: {
      bookingDate: minDateStr,
      wallSizeSqFt: 120,
      serviceAddress: '',
      notes: '',
    },
  });

  const selectedDate = watch('bookingDate');
  const selectedSize = watch('wallSizeSqFt') || 10;
  const calculatedTotal = Math.round(selectedSize * ratePerSqFt);
  const isDateBooked = bookedDates.includes(selectedDate);

  useEffect(() => {
    api.getWallAvailability()
      .then((res) => {
        if (res.success) {
          if (res.ratePerSqFt) setRatePerSqFt(res.ratePerSqFt);
          if (res.bookedDates) setBookedDates(res.bookedDates);
        }
      })
      .catch((err) => console.error('Error fetching wall availability:', err))
      .finally(() => setLoadingAvailability(false));
  }, []);

  const onSubmit = async (data: WallBookingFormData) => {
    if (!isAuthenticated) {
      toastError('Sign In Required', 'Please log in to book a wall painting date.');
      navigate('/login');
      return;
    }

    if (isDateBooked) {
      toastError('Date Unavailable', 'This calendar date is already reserved. Please select another date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createWallBooking({
        bookingDate: data.bookingDate,
        wallSizeSqFt: data.wallSizeSqFt,
        serviceAddress: data.serviceAddress,
        notes: data.notes,
      });

      success('Wall Booking Requested!', 'Our studio team has received your wall booking request.');
      setBookingSuccessModal(res.booking);
      // Refresh booked dates
      setBookedDates((prev) => [...prev, data.bookingDate]);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 409) {
        toastError('Date Conflict', 'This date was just reserved by another client. Please pick another date.');
        // Refresh availability
        const refresh = await api.getWallAvailability();
        if (refresh.bookedDates) setBookedDates(refresh.bookedDates);
      } else {
        toastError('Booking Error', err.message || 'Could not submit wall booking.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Editorial Header */}
      <div className="bg-atelier-chartreuse/25 border-2 border-atelier-ink rounded-3xl p-8 sm:p-14 shadow-brutal relative overflow-hidden">
        <div className="max-w-2xl space-y-4">
          <span className="art-badge bg-atelier-tomato text-white">
            Architectural Wall Murals
          </span>
          <h1 className="font-display font-black text-4xl sm:text-6xl text-atelier-ink tracking-tight leading-none">
            TRANSFORM YOUR WALLS INTO ART.
          </h1>
          <p className="font-body text-base sm:text-lg text-atelier-ink/80 leading-relaxed font-medium">
            Bespoke, large-scale wall painting executed by our resident master artisans. From traditional folk motifs to contemporary color-block frescoes, we transform ordinary rooms into breathtaking sanctuaries.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white font-display font-bold text-xs border border-atelier-ink">
              <ShieldCheck className="w-3.5 h-3.5 text-atelier-tomato" />
              Standard Studio Rate: ₹{ratePerSqFt}/sq.ft
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white font-display font-bold text-xs border border-atelier-ink">
              <Calendar className="w-3.5 h-3.5 text-atelier-lavender-dark" />
              One Client Active Per Date
            </span>
          </div>
        </div>
      </div>

      {/* Booking Interactive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Interactive Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-atelier-ink shadow-brutal p-8 space-y-8">
          <div>
            <h2 className="font-display font-black text-2xl text-atelier-ink">
              Reserve Your Wall Painting Service
            </h2>
            <p className="text-sm text-atelier-muted font-body mt-1">
              Select an available calendar date (7–90 days from today) and configure your wall dimensions.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Date Selection */}
            <div className="space-y-2">
              <label className="block font-display font-bold text-sm text-atelier-ink">
                1. Choose Service Date (7 to 90 Days Away)
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={minDateStr}
                  max={maxDateStr}
                  {...register('bookingDate')}
                  className={`w-full p-3.5 rounded-xl border-2 font-body text-sm font-semibold focus:outline-none transition-colors ${
                    isDateBooked
                      ? 'border-atelier-tomato bg-atelier-tomato/10 text-atelier-tomato'
                      : 'border-atelier-ink bg-atelier-cream focus:bg-white focus:ring-2 focus:ring-atelier-chartreuse'
                  }`}
                />
              </div>

              {/* Date status callout */}
              {isDateBooked ? (
                <p className="text-xs font-bold text-atelier-tomato flex items-center gap-1.5 mt-1">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  This date is already booked or requested. Please choose another date.
                </p>
              ) : (
                <p className="text-xs text-atelier-muted flex items-center gap-1.5 mt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-atelier-chartreuse fill-atelier-ink" />
                  Date is currently open for booking.
                </p>
              )}
              {errors.bookingDate && (
                <p className="text-xs text-atelier-tomato font-bold">{errors.bookingDate.message}</p>
              )}
            </div>

            {/* Wall Size Range Slider & Stepper */}
            <div className="space-y-3 bg-atelier-cream p-5 rounded-2xl border-2 border-atelier-ink">
              <div className="flex items-center justify-between">
                <label className="font-display font-bold text-sm text-atelier-ink">
                  2. Wall Dimensions (10 – 500 Sq.Ft)
                </label>
                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-xl border-2 border-atelier-ink font-display font-black text-lg">
                  <span>{selectedSize}</span>
                  <span className="text-xs font-bold text-atelier-muted">sq.ft</span>
                </div>
              </div>

              <input
                type="range"
                min={10}
                max={500}
                step={5}
                value={selectedSize}
                onChange={(e) => setValue('wallSizeSqFt', Number(e.target.value))}
                className="w-full accent-atelier-tomato cursor-pointer"
              />

              <div className="flex justify-between text-[11px] font-bold text-atelier-muted">
                <span>10 sq.ft (Feature Niche)</span>
                <span>250 sq.ft (Accent Wall)</span>
                <span>500 sq.ft (Full Hallway)</span>
              </div>
              {errors.wallSizeSqFt && (
                <p className="text-xs text-atelier-tomato font-bold">{errors.wallSizeSqFt.message}</p>
              )}
            </div>

            {/* Service Address */}
            <div className="space-y-2">
              <label className="block font-display font-bold text-sm text-atelier-ink">
                3. Service Location / Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-atelier-muted" />
                <textarea
                  rows={2}
                  placeholder="Street address, apartment/villa number, city & pincode..."
                  {...register('serviceAddress')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-atelier-chartreuse"
                />
              </div>
              {errors.serviceAddress && (
                <p className="text-xs text-atelier-tomato font-bold">{errors.serviceAddress.message}</p>
              )}
            </div>

            {/* Vision Notes */}
            <div className="space-y-2">
              <label className="block font-display font-bold text-sm text-atelier-ink">
                4. Artistic Vision &amp; Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Preferred motifs (e.g., Warli tree of life, Gond wildlife, Kerala temple mural), lighting conditions, wall texture..."
                {...register('notes')}
                className="w-full p-3 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-atelier-chartreuse"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isDateBooked}
              className="btn-accent w-full py-4 text-base shadow-brutal-lg"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Submitting Wall Booking...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Paintbrush className="w-5 h-5" />
                  Request Wall Booking • ₹{calculatedTotal.toLocaleString('en-IN')}
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Booking Summary Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-atelier-lavender rounded-3xl border-2 border-atelier-ink shadow-brutal-lg p-8 space-y-6 sticky top-28">
            <div className="flex items-center justify-between border-b-2 border-atelier-ink/20 pb-4">
              <h3 className="font-display font-black text-xl text-atelier-ink">
                LIVE ESTIMATE SUMMARY
              </h3>
              <Calculator className="w-5 h-5 text-atelier-ink" />
            </div>

            <div className="space-y-4 text-sm font-body">
              <div className="flex justify-between items-center">
                <span className="text-atelier-ink/70 font-medium">Selected Date</span>
                <span className="font-display font-bold text-atelier-ink">
                  {selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-atelier-ink/70 font-medium">Wall Area</span>
                <span className="font-display font-bold text-atelier-ink">
                  {selectedSize} sq.ft
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-atelier-ink/70 font-medium">Base Studio Rate</span>
                <span className="font-display font-bold text-atelier-ink">
                  ₹{ratePerSqFt} / sq.ft
                </span>
              </div>

              <div className="pt-4 border-t-2 border-atelier-ink/20 flex justify-between items-baseline">
                <div>
                  <span className="font-display font-black text-2xl text-atelier-ink block">
                    TOTAL ESTIMATE
                  </span>
                  <span className="text-[11px] text-atelier-ink/60 font-medium">
                    Includes consultation &amp; master paints
                  </span>
                </div>
                <span className="font-display font-black text-3xl text-atelier-ink">
                  ₹{calculatedTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Atelier Guarantee Callout */}
            <div className="bg-white/80 p-4 rounded-2xl border-2 border-atelier-ink text-xs font-body space-y-2">
              <p className="font-bold text-atelier-ink flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-atelier-tomato" />
                Fair Cancellation Policy
              </p>
              <p className="text-atelier-muted leading-relaxed">
                You can cancel this booking at any time up to 3 days prior to your reserved date directly from your client dashboard. Cancelled dates immediately release for other clients.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-atelier-ink/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border-4 border-atelier-ink shadow-brutal-xl max-w-md w-full p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-atelier-chartreuse border-2 border-atelier-ink shadow-brutal flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-atelier-ink" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-black text-2xl text-atelier-ink">
                Booking Request Placed!
              </h3>
              <p className="text-sm text-atelier-muted font-body leading-relaxed">
                Your wall painting booking for{' '}
                <span className="font-bold text-atelier-ink">
                  {new Date(bookingSuccessModal.bookingDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                </span>{' '}
                has been recorded with status{' '}
                <span className="art-badge bg-atelier-lavender text-atelier-ink">requested</span>.
              </p>
            </div>

            <div className="bg-atelier-cream p-4 rounded-xl border-2 border-atelier-ink text-left text-xs space-y-1">
              <p><span className="font-bold">Total Quote:</span> ₹{bookingSuccessModal.totalPrice.toLocaleString('en-IN')}</p>
              <p><span className="font-bold">Coverage:</span> {bookingSuccessModal.wallSizeSqFt} sq.ft</p>
              <p><span className="font-bold">Location:</span> {bookingSuccessModal.serviceAddress}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setBookingSuccessModal(null)}
                className="btn-outline flex-1"
              >
                Close
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary flex-1"
              >
                View Dashboard
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
