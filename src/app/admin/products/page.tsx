'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit3, Trash2, X, PlusCircle, Save, 
  Barcode, Calendar, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface Product {
  id: string;
  barcode: string;
  name: string;
  image: string;
  description: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  supplierName: string;
  expiryDate?: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Fruits & Vegetables');
  const [barcode, setBarcode] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [supplierName, setSupplierName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      setError('Failed to fetch products catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setName('');
    setCategory('Fruits & Vegetables');
    setBarcode('');
    setImage('');
    setDescription('');
    setPurchasePrice('');
    setSellingPrice('');
    setStockQuantity('');
    setReorderLevel('5');
    setSupplierName('');
    setExpiryDate('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setModalMode('edit');
    setEditingId(p.id);
    setName(p.name);
    setCategory(p.category);
    setBarcode(p.barcode || '');
    setImage(p.image || '');
    setDescription(p.description || '');
    setPurchasePrice(p.purchasePrice.toString());
    setSellingPrice(p.sellingPrice.toString());
    setStockQuantity(p.stockQuantity.toString());
    setReorderLevel(p.reorderLevel.toString());
    setSupplierName(p.supplierName || '');
    setExpiryDate(p.expiryDate ? p.expiryDate.split('T')[0] : '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const parsedPurchase = parseFloat(purchasePrice);
    const parsedSelling = parseFloat(sellingPrice);
    
    if (isNaN(parsedPurchase) || parsedPurchase <= 0) {
      setError('Please enter a valid purchase price.');
      return;
    }
    if (isNaN(parsedSelling) || parsedSelling <= 0) {
      setError('Please enter a valid selling price.');
      return;
    }
    if (parsedSelling < parsedPurchase) {
      setError('Warning: Selling price is less than purchase cost. Negative margins.');
    }

    const payload = {
      name,
      category,
      barcode: barcode.trim() || undefined,
      image: image.trim() || undefined,
      description: description.trim() || undefined,
      purchasePrice: parsedPurchase,
      sellingPrice: parsedSelling,
      stockQuantity: parseInt(stockQuantity) || 0,
      reorderLevel: parseInt(reorderLevel) || 5,
      supplierName: supplierName.trim() || undefined,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null
    };

    try {
      const url = modalMode === 'create' 
        ? '/api/products' 
        : `/api/products/${editingId}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save product.');
      }

      setSuccessMsg(modalMode === 'create' ? 'Product created successfully!' : 'Product updated successfully!');
      setIsModalOpen(false);
      await loadProducts();
      
      // Auto clear alert
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (err: any) {
      setError(err.message || 'Error occurred while saving product catalog.');
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${prodName}"?`)) return;
    setError('');
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('Product deleted successfully!');
        await loadProducts();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const d = await res.json();
        setError(d.message || 'Failed to delete product.');
      }
    } catch (e) {
      setError('Connection error deleting product.');
    }
  };

  // Filter products by query
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.includes(searchQuery)
  );

  const categories = [
    'Fruits & Vegetables', 'Dairy, Bread & Eggs', 'Munchies & Chips', 
    'Cold Drinks & Juices', 'Rice, Atta & Dals', 'Masalas & Spices', 
    'Personal Care', 'Household Essentials'
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Products Catalog</h1>
          <p className="text-sm text-foreground/50 mt-1">Manage grocery items, barcodes, internal supplier purchase costs, and public selling prices.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="rounded-xl bg-primary px-5 py-3 text-xs font-black text-white hover:bg-primary-hover shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {successMsg && (
        <div className="rounded-lg bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-600 border border-emerald-500/25">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-500/10 p-3.5 text-xs font-bold text-red-500 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Search Filter Header */}
      <div className="relative max-w-md w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by barcode, name, or category..."
          className="w-full rounded-xl border border-border-color bg-card-bg py-2.5 pl-10 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-semibold"
        />
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-foreground/45" />
      </div>

      {/* Main catalog directory */}
      <div className="rounded-2xl border border-border-color bg-card-bg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-foreground/5 text-xs font-bold text-foreground/60 uppercase">
                <th className="p-3">Product Info</th>
                <th className="p-3">Category</th>
                <th className="p-3">Barcode</th>
                <th className="p-3 text-center">Purchase (Cost)</th>
                <th className="p-3 text-center">Selling (Price)</th>
                <th className="p-3 text-center">Margin</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color font-semibold">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-foreground/40 font-bold">
                    No products matching search query.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const profit = p.sellingPrice - p.purchasePrice;
                  const marginPct = Math.round((profit / p.sellingPrice) * 100);
                  const isLow = p.stockQuantity <= p.reorderLevel;

                  return (
                    <tr key={p.id} className="hover:bg-foreground/2">
                      <td className="p-3 flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="h-9 w-9 rounded-lg object-cover border border-border-color" />
                        <div>
                          <span className="block font-bold text-foreground truncate max-w-[200px]">{p.name}</span>
                          <span className="block text-[10px] text-foreground/45 mt-0.5 max-w-[200px] truncate">{p.description || 'No description'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-foreground/80">{p.category}</td>
                      <td className="p-3 font-mono font-bold text-foreground/70">{p.barcode || 'N/A'}</td>
                      <td className="p-3 text-center text-foreground/75">₹{p.purchasePrice}</td>
                      <td className="p-3 text-center text-foreground font-bold">₹{p.sellingPrice}</td>
                      <td className="p-3 text-center text-primary font-black">
                        ₹{Math.round(profit * 100) / 100} ({marginPct}%)
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.stockQuantity === 0 
                            ? 'bg-red-500/10 text-red-500' 
                            : isLow 
                              ? 'bg-yellow-500/10 text-yellow-600' 
                              : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {p.stockQuantity} (Min: {p.reorderLevel})
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 shrink-0">
                        <button
                          onClick={() => openEditModal(p)}
                          className="rounded-lg p-1.5 text-foreground/50 hover:text-primary hover:bg-foreground/5 transition-colors cursor-pointer inline-flex"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="rounded-lg p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer inline-flex"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Modal Form Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border-color bg-card-bg p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5 animate-scale-in">
            <div className="flex justify-between items-center border-b border-border-color/50 pb-3">
              <h2 className="text-base font-black text-foreground uppercase">
                {modalMode === 'create' ? 'Add New Product' : 'Modify Product'}
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
              
              {/* Product name */}
              <div>
                <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nandini Toned Milk 500ml"
                  className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Category & Barcode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Barcode (GTIN)</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 89012340001"
                    className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Pricing details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Purchase (Supplier Cost)</label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="e.g. 35"
                    step="0.01"
                    className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Selling Price (Public)</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="e.g. 45"
                    step="0.01"
                    className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                    required
                  />
                </div>
              </div>

              {/* Stock quantities & reorders */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Stock Quantity</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Reorder Alert Threshold</label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                  />
                </div>
              </div>

              {/* Image URL & Description */}
              <div>
                <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Product Image (Unsplash / URL)</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Paste high-res image link..."
                  className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Product Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter details, nutrient facts or weight info..."
                  rows={2}
                  className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Supplier and Expiry */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Supplier Name</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Amul Dairy"
                    className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-foreground/75 uppercase tracking-wider mb-1.5">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full rounded-lg border border-border-color bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-bold"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
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
                  Save Product
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
