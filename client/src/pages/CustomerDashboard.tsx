import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PaintingOrder, WallBooking, PotteryRequest, PotteryItem, PotteryGlaze } from '../types';
import { ShoppingBag, Paintbrush, Flame, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Edit, ArrowRight, X } from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'paintings' | 'wall' | 'pottery'>('paintings');
  
  // Data state
  const [paintingOrders, setPaintingOrders] = useState<PaintingOrder[]>([]);
  const [wallBookings, setWallBookings] = useState<WallBooking[]>([]);
  const [potteryRequests, setPotteryRequests] = useState<PotteryRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Pottery Modal state
  const [editingPottery, setEditingPottery] = useState<PotteryRequest | null>(null);
  const [potteryItems, setPotteryItems] = useState<PotteryItem[]>([]);
  const [potteryGlazes, setPotteryGlazes] = useState<PotteryGlaze[]>([]);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editDate, setEditDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editItemId, setEditItemId] = useState<string>('');
  const [editGlazeId, setEditGlazeId] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, wallRes, potteryRes] = await Promise.all([
        api.getMyPaintingOrders(),
        api.getMyWallBookings(),
        api.getMyPotteryRequests(),
      ]);

      if (ordersRes.success) setPaintingOrders(ordersRes.orders);
      if (wallRes.success) setWallBookings(wallRes.bookings);
      if (potteryRes.success) setPotteryRequests(potteryRes.requests);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Helper date diff
  const getDaysUntil = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const d1 = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const d2 = new Date(Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()));
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Actions
  const handleCancelPaintingOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this artwork acquisition? The painting will be made available for other collectors.')) {
      return;
    }

    try {
      const res = await api.cancelPaintingOrder(orderId);
      success('Order Cancelled', res.message || 'Artwork purchase cancelled and restored to gallery.');
      setPaintingOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      );
    } catch (err: any) {
      toastError('Cancellation Error', err.message || 'Could not cancel order.');
    }
  };

  const handleCancelWallBooking = async (booking: WallBooking) => {
    const daysUntil = getDaysUntil(booking.bookingDate);
    if (daysUntil < 3) {
      toastError(
        'Cancellation Deadline Exceeded',
        `Bookings can only be cancelled at least 3 days prior to the date. This booking is ${daysUntil} day(s) away.`
      );
      return;
    }

    if (!window.confirm('Cancel this wall painting booking? The calendar date will be released.')) {
      return;
    }

    try {
      const res = await api.cancelWallBooking(booking.id);
      success('Booking Cancelled', res.message || 'Wall painting date released.');
      setWallBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
      );
    } catch (err: any) {
      toastError('Cancellation Error', err.message || 'Could not cancel booking.');
    }
  };

  const handleCancelPottery = async (requestId: string) => {
    if (!window.confirm('Cancel this pottery commission request?')) {
      return;
    }

    try {
      const res = await api.cancelPotteryRequest(requestId);
      success('Commission Cancelled', res.message || 'Pottery commission request cancelled.');
      setPotteryRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: 'cancelled' } : r))
      );
    } catch (err: any) {
      toastError('Cancellation Error', err.message || 'Could not cancel commission.');
    }
  };

  const openEditPotteryModal = async (req: PotteryRequest) => {
    setEditingPottery(req);
    setEditQuantity(req.quantity);
    setEditDate(req.neededByDate.split('T')[0]);
    setEditNotes(req.notes || '');
    setEditItemId(req.potteryItemId);
    setEditGlazeId(req.potteryGlazeId);

    // Fetch items & glazes if not already loaded
    if (potteryItems.length === 0 || potteryGlazes.length === 0) {
      const [itemsRes, glazesRes] = await Promise.all([
        api.getPotteryItems(),
        api.getPotteryGlazes(),
      ]);
      if (itemsRes.success) setPotteryItems(itemsRes.items);
      if (glazesRes.success) setPotteryGlazes(glazesRes.glazes);
    }
  };

  const savePotteryEdit = async () => {
    if (!editingPottery) return;
    setSavingEdit(true);

    try {
      const res = await api.editPotteryRequest(editingPottery.id, {
        potteryItemId: editItemId,
        potteryGlazeId: editGlazeId,
        quantity: editQuantity,
        neededByDate: editDate,
        notes: editNotes,
      });

      success('Commission Updated', 'Your pottery request has been saved.');
      setPotteryRequests((prev) =>
        prev.map((r) => (r.id === editingPottery.id ? res.request : r))
      );
      setEditingPottery(null);
    } catch (err: any) {
      toastError('Update Error', err.message || 'Could not update pottery commission.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header Profile Banner */}
      <div className="bg-atelier-lavender border-2 border-atelier-ink rounded-3xl p-8 sm:p-10 shadow-brutal flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="art-badge bg-atelier-chartreuse text-atelier-ink">
            Client Atelier Space
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-atelier-ink mt-2">
            HELLO, {user?.name?.toUpperCase()}
          </h1>
          <p className="text-sm text-atelier-muted font-body mt-1">
            Track your artwork acquisitions, wall mural schedules, and ceramic commission requests.
          </p>
        </div>

        <div className="flex gap-3">
          <Link to="/gallery" className="btn-primary text-xs py-2 px-4">
            <ShoppingBag className="w-3.5 h-3.5 mr-1" />
            Buy Paintings
          </Link>
          <Link to="/wall-art" className="btn-accent text-xs py-2 px-4">
            <Paintbrush className="w-3.5 h-3.5 mr-1" />
            Book Wall
          </Link>
          <Link to="/pottery" className="btn-lavender text-xs py-2 px-4">
            <Flame className="w-3.5 h-3.5 mr-1" />
            Pottery
          </Link>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white border-2 border-atelier-ink rounded-2xl shadow-brutal w-fit">
        <button
          onClick={() => setActiveTab('paintings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'paintings'
              ? 'bg-atelier-chartreuse text-atelier-ink shadow-sm'
              : 'text-atelier-muted hover:text-atelier-ink'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          My Paintings ({paintingOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('wall')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'wall'
              ? 'bg-atelier-chartreuse text-atelier-ink shadow-sm'
              : 'text-atelier-muted hover:text-atelier-ink'
          }`}
        >
          <Paintbrush className="w-4 h-4" />
          My Wall Bookings ({wallBookings.length})
        </button>

        <button
          onClick={() => setActiveTab('pottery')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'pottery'
              ? 'bg-atelier-chartreuse text-atelier-ink shadow-sm'
              : 'text-atelier-muted hover:text-atelier-ink'
          }`}
        >
          <Flame className="w-4 h-4" />
          My Pottery Commissions ({potteryRequests.length})
        </button>
      </div>

      {/* TAB 1: PAINTINGS */}
      {activeTab === 'paintings' && (
        <div className="space-y-6">
          {paintingOrders.length === 0 ? (
            <div className="bg-white border-2 border-atelier-ink rounded-3xl p-12 text-center max-w-lg mx-auto shadow-brutal space-y-4">
              <ShoppingBag className="w-12 h-12 text-atelier-lavender mx-auto" />
              <h3 className="font-display font-bold text-xl text-atelier-ink">No Painting Orders Yet</h3>
              <p className="text-sm text-atelier-muted font-body">
                Explore our catalog of 12 original folk paintings and acquire your first original masterwork.
              </p>
              <Link to="/gallery" className="btn-primary">
                Browse Gallery
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paintingOrders.map((order) => {
                const isPlaced = order.status === 'placed';

                return (
                  <div key={order.id} className="art-card p-6 flex flex-col justify-between">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-atelier-ink flex-shrink-0 bg-atelier-cream">
                        <img
                          src={`/${order.painting?.imageUrl}`}
                          alt={order.painting?.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`art-badge text-[10px] ${
                            isPlaced ? 'bg-atelier-chartreuse text-atelier-ink' : 'bg-atelier-ink/10 text-atelier-muted'
                          }`}>
                            {order.status}
                          </span>
                          <span className="text-[10px] font-mono text-atelier-muted">
                            Order #{order.id.slice(-6)}
                          </span>
                        </div>

                        <h3 className="font-display font-black text-lg text-atelier-ink line-clamp-1">
                          {order.painting?.title}
                        </h3>
                        <p className="text-xs text-atelier-muted font-medium">
                          By {order.painting?.artist}
                        </p>
                        <p className="font-display font-bold text-sm text-atelier-ink pt-1">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-atelier-border/60 flex items-center justify-between mt-4">
                      <span className="text-xs text-atelier-muted">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </span>

                      {isPlaced && (
                        <button
                          onClick={() => handleCancelPaintingOrder(order.id)}
                          className="btn-outline text-xs py-1.5 px-3 text-atelier-tomato hover:bg-atelier-tomato hover:text-white"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WALL BOOKINGS */}
      {activeTab === 'wall' && (
        <div className="space-y-6">
          {wallBookings.length === 0 ? (
            <div className="bg-white border-2 border-atelier-ink rounded-3xl p-12 text-center max-w-lg mx-auto shadow-brutal space-y-4">
              <Paintbrush className="w-12 h-12 text-atelier-chartreuse mx-auto" />
              <h3 className="font-display font-bold text-xl text-atelier-ink">No Wall Bookings Yet</h3>
              <p className="text-sm text-atelier-muted font-body">
                Bring art to your walls! Pick a date and calculate instant pricing at ₹150/sq.ft.
              </p>
              <Link to="/wall-art" className="btn-accent">
                Book Wall Mural
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wallBookings.map((booking) => {
                const daysUntil = getDaysUntil(booking.bookingDate);
                const canCancel = (booking.status === 'requested' || booking.status === 'confirmed') && daysUntil >= 3;

                return (
                  <div key={booking.id} className="art-card p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`art-badge text-[10px] ${
                          booking.status === 'confirmed'
                            ? 'bg-atelier-chartreuse text-atelier-ink'
                            : booking.status === 'requested'
                            ? 'bg-atelier-lavender text-atelier-ink'
                            : booking.status === 'declined'
                            ? 'bg-atelier-tomato text-white'
                            : 'bg-atelier-ink/10 text-atelier-muted'
                        }`}>
                          {booking.status}
                        </span>
                        <span className="text-xs font-display font-bold text-atelier-ink">
                          {booking.wallSizeSqFt} sq.ft @ ₹{booking.ratePerSqFt}/sq.ft
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-atelier-muted uppercase block">Reserved Date</span>
                          <span className="font-display font-black text-xl text-atelier-ink">
                            {new Date(booking.bookingDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                          </span>
                        </div>
                        <span className="font-display font-black text-2xl text-atelier-ink">
                          ₹{booking.totalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="bg-atelier-cream p-3 rounded-xl border border-atelier-border text-xs space-y-1">
                        <p className="font-bold text-atelier-ink">Service Address:</p>
                        <p className="text-atelier-muted">{booking.serviceAddress}</p>
                        {booking.notes && (
                          <p className="text-atelier-muted italic pt-1">Notes: "{booking.notes}"</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-atelier-border/60 flex items-center justify-between">
                      <span className="text-xs text-atelier-muted">
                        {daysUntil >= 0 ? `${daysUntil} day(s) until service` : 'Date has passed'}
                      </span>

                      {canCancel ? (
                        <button
                          onClick={() => handleCancelWallBooking(booking)}
                          className="btn-outline text-xs py-1.5 px-3 text-atelier-tomato hover:bg-atelier-tomato hover:text-white"
                        >
                          Cancel Booking
                        </button>
                      ) : (booking.status === 'requested' || booking.status === 'confirmed') ? (
                        <span className="text-[11px] text-atelier-muted font-bold" title="Must be cancelled at least 3 days prior">
                          Within 3-Day Cutoff
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: POTTERY COMMISSIONS */}
      {activeTab === 'pottery' && (
        <div className="space-y-6">
          {potteryRequests.length === 0 ? (
            <div className="bg-white border-2 border-atelier-ink rounded-3xl p-12 text-center max-w-lg mx-auto shadow-brutal space-y-4">
              <Flame className="w-12 h-12 text-atelier-tomato mx-auto" />
              <h3 className="font-display font-bold text-xl text-atelier-ink">No Pottery Commissions Yet</h3>
              <p className="text-sm text-atelier-muted font-body">
                Commission handcrafted clay vessels with our traditional mineral glazes in Kumkum, Haldi, or Indigo.
              </p>
              <Link to="/pottery" className="btn-lavender">
                Commission Pottery
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {potteryRequests.map((req) => {
                const canModify = req.status === 'requested';

                return (
                  <div key={req.id} className="art-card p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`art-badge text-[10px] ${
                          req.status === 'accepted'
                            ? 'bg-atelier-chartreuse text-atelier-ink'
                            : req.status === 'requested'
                            ? 'bg-atelier-lavender text-atelier-ink'
                            : req.status === 'declined'
                            ? 'bg-atelier-tomato text-white'
                            : 'bg-atelier-ink/10 text-atelier-muted'
                        }`}>
                          {req.status}
                        </span>
                        <span className="font-display font-bold text-sm text-atelier-ink bg-atelier-cream px-3 py-1 rounded-full border border-atelier-ink">
                          {req.quantity} Pieces
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display font-black text-xl text-atelier-ink">
                          {req.item?.name}
                        </h3>
                        <p className="text-xs font-bold text-atelier-muted mt-0.5">
                          Glaze: <span className="text-atelier-ink">{req.glaze?.name}</span>
                        </p>
                      </div>

                      <div className="bg-atelier-cream p-3 rounded-xl border border-atelier-border text-xs space-y-1">
                        <p><span className="font-bold">Needed By:</span> {new Date(req.neededByDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                        {req.notes && <p><span className="font-bold">Notes:</span> {req.notes}</p>}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-atelier-border/60 flex items-center justify-between">
                      <span className="text-[11px] text-atelier-muted">
                        Submitted {new Date(req.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </span>

                      {canModify ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditPotteryModal(req)}
                            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleCancelPottery(req.id)}
                            className="btn-outline text-xs py-1.5 px-3 text-atelier-tomato hover:bg-atelier-tomato hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-atelier-muted font-bold">
                          Status Locked ({req.status})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EDIT POTTERY MODAL */}
      {editingPottery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-atelier-ink/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border-4 border-atelier-ink shadow-brutal-xl max-w-lg w-full p-8 space-y-6">
            <div className="flex items-center justify-between border-b-2 border-atelier-ink/10 pb-4">
              <h3 className="font-display font-black text-xl text-atelier-ink">
                Edit Commission Request
              </h3>
              <button
                onClick={() => setEditingPottery(null)}
                className="p-1 rounded-full border border-atelier-ink hover:bg-atelier-tomato hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm font-body">
              {/* Item selection */}
              <div className="space-y-1">
                <label className="font-display font-bold text-xs uppercase">Pottery Vessel</label>
                <select
                  value={editItemId}
                  onChange={(e) => setEditItemId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold"
                >
                  {potteryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Glaze selection */}
              <div className="space-y-1">
                <label className="font-display font-bold text-xs uppercase">Mineral Glaze</label>
                <select
                  value={editGlazeId}
                  onChange={(e) => setEditGlazeId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold"
                >
                  {potteryGlazes.map((glaze) => (
                    <option key={glaze.id} value={glaze.id}>
                      {glaze.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="font-display font-bold text-xs uppercase">Quantity (1 to 12)</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold"
                />
              </div>

              {/* Needed-By Date */}
              <div className="space-y-1">
                <label className="font-display font-bold text-xs uppercase">Needed-By Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-display font-bold text-xs uppercase">Custom Inscription / Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingPottery(null)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={savePotteryEdit}
                disabled={savingEdit}
                className="btn-primary flex-1"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
