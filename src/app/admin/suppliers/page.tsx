'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit3, Trash2, X, Save, 
  Phone, MapPin, Truck, ChevronRight
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactNumber: string;
  address?: string;
  createdAt: string;
}

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');

  const loadSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (e) {
      setError('Failed to load supplier records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setName('');
    setContactNumber('');
    setAddress('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setModalMode('edit');
    setEditingId(s.id);
    setName(s.name);
    setContactNumber(s.contactNumber);
    setAddress(s.address || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter a supplier name.');
      return;
    }
    if (contactNumber.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit contact number.');
      return;
    }

    const payload = {
      name: name.trim(),
      contactNumber: contactNumber.trim(),
      address: address.trim() || undefined
    };

    try {
      const url = modalMode === 'create' ? '/api/suppliers' : `/api/suppliers/${editingId}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save supplier.');
      }

      setSuccess(modalMode === 'create' ? 'Supplier added successfully!' : 'Supplier profile updated!');
      setIsModalOpen(false);
      await loadSuppliers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving supplier details.');
    }
  };

  const handleDelete = async (id: string, supName: string) => {
    if (!confirm(`Are you sure you want to permanently delete supplier "${supName}"?`)) return;
    setError('');
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Supplier purged successfully!');
        await loadSuppliers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const d = await res.json();
        setError(d.message || 'Failed to delete supplier.');
      }
    } catch (e) {
      setError('Connection error deleting supplier.');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactNumber.includes(searchQuery) ||
    (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Supplier Registers</h1>
          <p className="text-sm text-foreground/50 mt-1">Manage vendor details, order procurement channels, and billing contacts.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="rounded-xl bg-primary px-5 py-3 text-xs font-black text-white hover:bg-primary-hover shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
        </button>
      </div>

      {success && (
        <div className="rounded-lg bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-600 border border-emerald-500/25">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-500/10 p-3.5 text-xs font-bold text-red-500 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="relative max-w-md w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search suppliers by name, contact, or location..."
          className="w-full rounded-xl border border-border-color bg-card-bg py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-semibold"
        />
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-foreground/45" />
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl border border-border-color bg-card-bg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-foreground/5 text-xs font-bold text-foreground/60 uppercase">
                <th className="p-3">Supplier Name</th>
                <th className="p-3">Contact Number</th>
                <th className="p-3">Contact Address</th>
                <th className="p-3">Registered Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color font-semibold">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-foreground/40 font-bold">
                    No suppliers matching query.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(s => (
                  <tr key={s.id} className="hover:bg-foreground/2">
                    <td className="p-3 flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-bold text-foreground">{s.name}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-foreground/75 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      {s.contactNumber}
                    </td>
                    <td className="p-3 text-foreground/60 max-w-xs truncate">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        {s.address || 'In-store drop off'}
                      </span>
                    </td>
                    <td className="p-3 text-foreground/45">
                      {new Date(s.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-right space-x-1 shrink-0">
                      <button
                        onClick={() => openEditModal(s)}
                        className="rounded-lg p-1.5 text-foreground/50 hover:text-primary hover:bg-foreground/5 transition-colors cursor-pointer inline-flex"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="rounded-lg p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer inline-flex"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border-color bg-card-bg p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex justify-between items-center border-b border-border-color/50 pb-3">
              <h2 className="text-base font-black text-foreground uppercase">
                {modalMode === 'create' ? 'Add Supplier Profile' : 'Edit Supplier'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-foreground/50 hover:bg-foreground/5 p-1 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-xs font-bold text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Supplier Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amul Dairy Traders"
                  className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Contact Phone Number</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. +91 98450 12345"
                  className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Office / Factory Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Industrial Area, Thanjavur..."
                  rows={3}
                  className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border-color/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-border-color py-3 text-xs font-bold hover:bg-foreground/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-white hover:bg-primary-hover shadow-md transition-all cursor-pointer"
                >
                  Save Vendor
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
