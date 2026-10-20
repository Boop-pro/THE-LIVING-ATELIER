import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Painting, PaintingOrder, WallBooking, PotteryRequest } from '../types';
import { Shield, Plus, Edit3, CheckCircle, XCircle, Paintbrush, Layers, Flame, ShoppingBag, Eye, X } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'paintings' | 'wall' | 'pottery'>('paintings');
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [orders, setOrders] = useState<PaintingOrder[]>([]);
  const [wallBookings, setWallBookings] = useState<WallBooking[]>([]);
  const [potteryRequests, setPotteryRequests] = useState<PotteryRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Painting modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPainting, setEditingPainting] = useState<Painting | null>(null);
  const [paintingForm, setPaintingForm] = useState({
    title: '',
    artist: '',
    description: '',
    price: 5000,
    imageUrl: 'images/p-001.jpg',
    status: 'available' as 'available' | 'sold',
  });
  const [savingPainting, setSavingPainting] = useState(false);

  // Access control check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'studio')) {
      toastError('Unauthorized', 'Studio Admin access restricted.');
      navigate('/login');
    }
  }, [user, authLoading, navigate, toastError]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [paintingsRes, ordersRes, wallRes, potteryRes] = await Promise.all([
        api.getPaintings(),
        api.getAllPaintingOrders(),
        api.getAllWallBookings(),
        api.getAllPotteryRequests(),
      ]);

      if (paintingsRes.success) setPaintings(paintingsRes.paintings);
      if (ordersRes.success) setOrders(ordersRes.orders);
      if (wallRes.success) setWallBookings(wallRes.bookings);
      if (potteryRes.success) setPotteryRequests(potteryRes.requests);
    } catch (err: any) {
      console.error('Error fetching admin workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  // Painting Handlers
  const openAddPaintingModal = () => {
    setPaintingForm({
      title: '',
      artist: '',
      description: '',
      price: 6000,
      imageUrl: 'images/p-001.jpg',
      status: 'available',
    });
    setEditingPainting(null);
    setShowAddModal(true);
  };

  const openEditPaintingModal = (p: Painting) => {
    setPaintingForm({
      title: p.title,
      artist: p.artist,
      description: p.description,
      price: p.price,
      imageUrl: p.imageUrl,
      status: p.status,
    });
    setEditingPainting(p);
    setShowAddModal(true);
  };

  const handleSavePainting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPainting(true);

    try {
      if (editingPainting) {
        const res = await api.updatePainting(editingPainting.id, paintingForm);
        success('Painting Updated', `Changes to "${res.painting.title}" saved.`);
        setPaintings((prev) =>
          prev.map((p) => (p.id === editingPainting.id ? res.painting : p))
        );
      } else {
        const res = await api.createPainting(paintingForm);
        success('Painting Created', `Artwork "${res.painting.title}" added to inventory.`);
        setPaintings((prev) => [...prev, res.painting]);
      }
      setShowAddModal(false);
    } catch (err: any) {
      toastError('Error Saving Painting', err.message || 'Operation failed.');
    } finally {
      setSavingPainting(false);
    }
  };

  // Wall Booking Handlers
  const handleConfirmWallBooking = async (id: string) => {
    try {
      const res = await api.confirmWallBooking(id);
      success('Booking Confirmed', res.message || 'Wall mural service date confirmed.');
      setWallBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'confirmed' } : b))
      );
    } catch (err: any) {
      toastError('Confirmation Error', err.message || 'Could not confirm booking.');
    }
  };

  const handleDeclineWallBooking = async (id: string) => {
    if (!window.confirm('Decline this wall booking request? The calendar date will be released for other clients.')) {
      return;
    }

    try {
      const res = await api.declineWallBooking(id);
      success('Booking Declined', res.message || 'Date released.');
      setWallBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'declined' } : b))
      );
    } catch (err: any) {
      toastError('Decline Error', err.message || 'Could not decline booking.');
    }
  };

  // Pottery Commission Handlers
  const handleAcceptPottery = async (id: string) => {
    try {
      const res = await api.acceptPotteryRequest(id);
      success('Commission Accepted', res.message || 'Assigned to studio kiln schedule.');
      setPotteryRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'accepted' } : r))
      );
    } catch (err: any) {
      toastError('Acceptance Error', err.message || 'Could not accept commission.');
    }
  };

  const handleDeclinePottery = async (id: string) => {
    if (!window.confirm('Decline this pottery commission?')) {
      return;
    }

    try {
      const res = await api.declinePotteryRequest(id);
      success('Commission Declined', res.message || 'Commission declined.');
      setPotteryRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'declined' } : r))
      );
    } catch (err: any) {
      toastError('Decline Error', err.message || 'Could not decline commission.');
    }
  };

  if (authLoading || !isAdmin) {
    return <div className="p-16 text-center font-display">Verifying Atelier Credentials...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Studio Admin Header Banner */}
      <div className="bg-atelier-tomato text-white border-2 border-atelier-ink rounded-3xl p-8 sm:p-10 shadow-brutal flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white font-display font-bold text-xs uppercase tracking-wider text-atelier-ink border border-atelier-ink shadow-sm">
            <Shield className="w-3.5 h-3.5 text-atelier-tomato" />
            Studio Master Administration
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mt-2">
            ATELIER OPERATIONS WORKSPACE
          </h1>
          <p className="text-sm text-atelier-cream/80 font-body mt-1">
            Manage painting inventory, confirm architectural wall painting dates, and review custom pottery commissions.
          </p>
        </div>

        <button
          onClick={openAddPaintingModal}
          className="btn-primary text-xs py-2.5 px-5 bg-atelier-chartreuse text-atelier-ink"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Painting
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white border-2 border-atelier-ink rounded-2xl shadow-brutal w-fit">
        <button
          onClick={() => setActiveTab('paintings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'paintings'
              ? 'bg-atelier-chartreuse text-atelier-ink shadow-sm'
              : 'text-atelier-muted hover:text-atelier-ink'
          }`}
        >
          <Paintbrush className="w-4 h-4" />
          Paintings &amp; Orders ({paintings.length})
        </button>

        <button
          onClick={() => setActiveTab('wall')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'wall'
              ? 'bg-atelier-chartreuse text-atelier-ink shadow-sm'
              : 'text-atelier-muted hover:text-atelier-ink'
          }`}
        >
          <Layers className="w-4 h-4" />
          Wall Bookings ({wallBookings.length})
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
          Pottery Commissions ({potteryRequests.length})
        </button>
      </div>

      {/* TAB 1: PAINTINGS INVENTORY & ORDERS */}
      {activeTab === 'paintings' && (
        <div className="space-y-10">
          
          {/* Inventory Table */}
          <div className="bg-white rounded-3xl border-2 border-atelier-ink shadow-brutal overflow-hidden">
            <div className="p-6 border-b-2 border-atelier-ink flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-xl text-atelier-ink">
                  Painting Inventory
                </h3>
                <p className="text-xs text-atelier-muted">
                  Catalog of all 12+ original paintings with real-time collector availability.
                </p>
              </div>
              <button
                onClick={openAddPaintingModal}
                className="btn-outline text-xs py-1.5 px-3"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Artwork
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-body">
                <thead className="bg-atelier-cream border-b-2 border-atelier-ink font-display font-bold text-xs uppercase text-atelier-ink">
                  <tr>
                    <th className="py-3 px-4">Artwork</th>
                    <th className="py-3 px-4">Artist</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-atelier-border">
                  {paintings.map((p) => (
                    <tr key={p.id} className="hover:bg-atelier-cream/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`/${p.imageUrl}`}
                            alt={p.title}
                            className="w-10 h-10 rounded-lg object-cover border border-atelier-ink"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=100&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div>
                            <span className="font-display font-bold text-sm block line-clamp-1">{p.title}</span>
                            <span className="text-[10px] font-mono text-atelier-muted">{p.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-atelier-ink">{p.artist}</td>
                      <td className="py-3 px-4 font-display font-bold text-xs">₹{p.price.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span className={`art-badge text-[10px] ${
                          p.status === 'available' ? 'bg-atelier-chartreuse text-atelier-ink' : 'bg-atelier-tomato text-white'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.status === 'available' ? (
                          <button
                            onClick={() => openEditPaintingModal(p)}
                            className="btn-outline text-xs py-1 px-3"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center text-[11px] font-medium text-atelier-muted px-2.5 py-1 bg-atelier-cream rounded-full border border-atelier-border cursor-not-allowed"
                            title="Sold paintings are permanently locked and cannot be edited"
                          >
                            Locked (Sold)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Customer Orders Table */}
          <div className="bg-white rounded-3xl border-2 border-atelier-ink shadow-brutal overflow-hidden">
            <div className="p-6 border-b-2 border-atelier-ink">
              <h3 className="font-display font-black text-xl text-atelier-ink">
                All Customer Painting Purchases ({orders.length})
              </h3>
              <p className="text-xs text-atelier-muted">
                Transaction log of all customer artwork acquisitions and cancellations.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-body">
                <thead className="bg-atelier-cream border-b-2 border-atelier-ink font-display font-bold text-xs uppercase text-atelier-ink">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Artwork</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-atelier-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-atelier-cream/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs">{o.id.slice(-8)}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold block text-xs">{o.customer?.name}</span>
                        <span className="text-[10px] text-atelier-muted">{o.customer?.email}</span>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">{o.painting?.title}</td>
                      <td className="py-3 px-4 font-display font-bold text-xs">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span className={`art-badge text-[10px] ${
                          o.status === 'placed' ? 'bg-atelier-chartreuse text-atelier-ink' : 'bg-atelier-ink/10 text-atelier-muted'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-atelier-muted">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: WALL BOOKINGS MANAGEMENT */}
      {activeTab === 'wall' && (
        <div className="bg-white rounded-3xl border-2 border-atelier-ink shadow-brutal overflow-hidden">
          <div className="p-6 border-b-2 border-atelier-ink">
            <h3 className="font-display font-black text-xl text-atelier-ink">
              Wall Painting Bookings Schedule
            </h3>
            <p className="text-xs text-atelier-muted">
              Confirm or decline requested mural service dates. Declining immediately releases the date.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-body">
              <thead className="bg-atelier-cream border-b-2 border-atelier-ink font-display font-bold text-xs uppercase text-atelier-ink">
                <tr>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Area &amp; Total</th>
                  <th className="py-3 px-4">Service Address</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-atelier-border">
                {wallBookings.map((b) => {
                  const isRequested = b.status === 'requested';

                  return (
                    <tr key={b.id} className="hover:bg-atelier-cream/50 transition-colors">
                      <td className="py-3 px-4 font-display font-bold text-sm">
                        {new Date(b.bookingDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold block text-xs">{b.customer?.name}</span>
                        <span className="text-[10px] text-atelier-muted">{b.customer?.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold block text-xs">{b.wallSizeSqFt} sq.ft</span>
                        <span className="text-xs text-atelier-muted">₹{b.totalPrice.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-atelier-muted max-w-xs truncate">
                        {b.serviceAddress}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`art-badge text-[10px] ${
                          b.status === 'confirmed'
                            ? 'bg-atelier-chartreuse text-atelier-ink'
                            : b.status === 'requested'
                            ? 'bg-atelier-lavender text-atelier-ink'
                            : b.status === 'declined'
                            ? 'bg-atelier-tomato text-white'
                            : 'bg-atelier-ink/10 text-atelier-muted'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isRequested ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleConfirmWallBooking(b.id)}
                              className="btn-primary text-xs py-1 px-3 bg-atelier-chartreuse text-atelier-ink"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleDeclineWallBooking(b.id)}
                              className="btn-outline text-xs py-1 px-3 text-atelier-tomato hover:bg-atelier-tomato hover:text-white"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-atelier-muted font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: POTTERY COMMISSIONS MANAGEMENT */}
      {activeTab === 'pottery' && (
        <div className="bg-white rounded-3xl border-2 border-atelier-ink shadow-brutal overflow-hidden">
          <div className="p-6 border-b-2 border-atelier-ink">
            <h3 className="font-display font-black text-xl text-atelier-ink">
              Custom Pottery Commissions Queue
            </h3>
            <p className="text-xs text-atelier-muted">
              Accept ceramic requests into the active kiln schedule or decline unfeasible commissions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-body">
              <thead className="bg-atelier-cream border-b-2 border-atelier-ink font-display font-bold text-xs uppercase text-atelier-ink">
                <tr>
                  <th className="py-3 px-4">Vessel &amp; Glaze</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Needed By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-atelier-border">
                {potteryRequests.map((r) => {
                  const isRequested = r.status === 'requested';

                  return (
                    <tr key={r.id} className="hover:bg-atelier-cream/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-display font-bold text-sm block">{r.item?.name}</span>
                        <span className="text-xs text-atelier-muted">Glaze: {r.glaze?.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold block text-xs">{r.customer?.name}</span>
                        <span className="text-[10px] text-atelier-muted">{r.customer?.email}</span>
                      </td>
                      <td className="py-3 px-4 font-display font-bold text-xs">{r.quantity} pcs</td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {new Date(r.neededByDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`art-badge text-[10px] ${
                          r.status === 'accepted'
                            ? 'bg-atelier-chartreuse text-atelier-ink'
                            : r.status === 'requested'
                            ? 'bg-atelier-lavender text-atelier-ink'
                            : r.status === 'declined'
                            ? 'bg-atelier-tomato text-white'
                            : 'bg-atelier-ink/10 text-atelier-muted'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isRequested ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleAcceptPottery(r.id)}
                              className="btn-primary text-xs py-1 px-3 bg-atelier-chartreuse text-atelier-ink"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclinePottery(r.id)}
                              className="btn-outline text-xs py-1 px-3 text-atelier-tomato hover:bg-atelier-tomato hover:text-white"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-atelier-muted font-medium">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT PAINTING MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-atelier-ink/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border-4 border-atelier-ink shadow-brutal-xl max-w-lg w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-atelier-ink/10 pb-4">
              <h3 className="font-display font-black text-xl text-atelier-ink">
                {editingPainting ? 'Edit Artwork' : 'Add New Original Painting'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full border border-atelier-ink hover:bg-atelier-tomato hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePainting} className="space-y-4 text-sm font-body">
              <div className="space-y-1">
                <label className="font-display font-bold text-xs uppercase">Artwork Title</label>
                <input
                  type="text"
                  required
                  value={paintingForm.title}
                  onChange={(e) => setPaintingForm({ ...paintingForm, title: e.target.value })}
                  placeholder="e.g. Lotus Sanctuary in Pattachitra"
                  className="w-full p-2.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-display font-bold text-xs uppercase">Artist Name</label>
                <input
                  type="text"
                  required
                  value={paintingForm.artist}
                  onChange={(e) => setPaintingForm({ ...paintingForm, artist: e.target.value })}
                  placeholder="e.g. Meera Kumari"
                  className="w-full p-2.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-display font-bold text-xs uppercase">Description &amp; Provenance</label>
                <textarea
                  rows={3}
                  required
                  value={paintingForm.description}
                  onChange={(e) => setPaintingForm({ ...paintingForm, description: e.target.value })}
                  placeholder="Style, medium, natural pigments, paper/cloth dimensions..."
                  className="w-full p-2.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-display font-bold text-xs uppercase">Price (INR)</label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={paintingForm.price}
                    onChange={(e) => setPaintingForm({ ...paintingForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-display font-bold text-xs uppercase">Availability Status</label>
                  <select
                    value={paintingForm.status}
                    onChange={(e) => setPaintingForm({ ...paintingForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-display font-bold text-xs uppercase">Image Path / URL</label>
                <input
                  type="text"
                  required
                  value={paintingForm.imageUrl}
                  onChange={(e) => setPaintingForm({ ...paintingForm, imageUrl: e.target.value })}
                  placeholder="images/p-001.jpg"
                  className="w-full p-2.5 rounded-xl border-2 border-atelier-ink bg-atelier-cream text-sm font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPainting}
                  className="btn-primary flex-1"
                >
                  {savingPainting ? 'Saving...' : editingPainting ? 'Save Changes' : 'Create Painting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
