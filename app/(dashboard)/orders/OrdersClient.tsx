"use client";

import React, { useState } from 'react';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { format } from 'date-fns';
import { EntityDrawer } from '@/components/EntityDrawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { FormField } from '@/components/ui/FormField';
import { FormSection } from '@/components/ui/FormSection';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { createOrder, updateOrderStatus, deleteOrder } from '@/app/actions';
import { ORDER_STATUSES, getOrderStatus } from '@/lib/status';
import { Timeline } from '@/components/Timeline';
import { Search } from 'lucide-react';

export function OrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  React.useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customer_name: '', company_name: '', email: '', phone: '',
    origin: '', destination: '', shipping_method: 'ocean',
    cargo_description: '', weight_kg: '', packages: '',
    preferred_departure_date: '', estimated_delivery_date: '',
    amount: '', currency: 'USD', quote_ref: '', notes: '',
    consent_to_contact: true, status: 'order_placed'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [updateStatusData, setUpdateStatusData] = useState({
    status: '', location: '', note: '', dateStr: ''
  });

  const filteredOrders = orders.filter(o => 
    o.order_id.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    o.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.origin.toLowerCase().includes(search.toLowerCase()) ||
    o.destination.toLowerCase().includes(search.toLowerCase())
  );

  // KPIs
  const total = orders.length;
  const inTransit = orders.filter(o => getOrderStatus(o.status)?.category === 'movement').length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const needsAttention = orders.filter(o => ['on_hold', 'customs_hold', 'delayed', 'damaged'].includes(o.status)).length;

  const columns = [
    { 
      header: 'Order ID', 
      accessorKey: 'order_id', 
      cell: (row: any) => (
        <span 
          className="font-mono cursor-pointer hover:underline"
          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(row.order_id); toast('Copied to clipboard'); }}
        >
          {row.order_id}
        </span>
      ) 
    },
    { header: 'Customer', accessorKey: 'customer_name', cell: (row: any) => <div><div className="font-medium text-[var(--text)]">{row.customer_name}</div><div className="text-xs text-[var(--text-muted)]">{row.company_name}</div></div> },
    { header: 'Route', accessorKey: 'origin', cell: (row: any) => `${row.origin} → ${row.destination}` },
    { header: 'Method', accessorKey: 'shipping_method', cell: (row: any) => <span className="capitalize">{row.shipping_method}</span> },
    { header: 'Status', accessorKey: 'status', cell: (row: any) => <StatusBadge status={row.status} type="order" /> },
    { header: 'ETA', accessorKey: 'estimated_delivery_date', cell: (row: any) => row.estimated_delivery_date ? format(new Date(row.estimated_delivery_date), 'MMM d, yyyy') : '-' },
  ];

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createOrder(formData);
    setIsSubmitting(false);
    
    if (res?.error) {
      toast(res.error);
    } else if (res?.success) {
      toast(`Order created: ${res.orderId}`);
      setIsAddModalOpen(false);
      router.refresh();
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await updateOrderStatus(selectedOrder.id, updateStatusData.status, updateStatusData.location, updateStatusData.note, updateStatusData.dateStr);
    setIsSubmitting(false);
    
    if (res?.error) {
      toast(res.error);
    } else {
      toast('Status updated');
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this order?')) {
      const res = await deleteOrder(selectedOrder.id);
      if (res?.error) toast(res.error);
      else {
        toast('Order deleted');
        router.refresh();
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto flex-1 mr-4">
          <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-sm"><div className="text-[var(--text-secondary)] text-sm">Total Orders</div><div className="text-2xl font-medium">{total}</div></div>
          <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-sm"><div className="text-[var(--text-secondary)] text-sm">In Transit</div><div className="text-2xl font-medium">{inTransit}</div></div>
          <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-sm"><div className="text-[var(--text-secondary)] text-sm">Delivered</div><div className="text-2xl font-medium">{delivered}</div></div>
          <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-sm"><div className="text-[var(--text-secondary)] text-sm">Needs Attention</div><div className="text-2xl font-medium">{needsAttention}</div></div>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>Add order</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
          <Input 
            placeholder="Search orders..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-10 h-[44px]"
          />
        </div>
      </div>

      <DataTable data={filteredOrders} columns={columns} onRowClick={(row) => {
        setSelectedOrder(row);
        setUpdateStatusData({ status: row.status, location: '', note: '', dateStr: '' });
      }} />

      <EntityDrawer
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order ${selectedOrder.order_id}` : ''}
      >
        {selectedOrder && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-medium">{selectedOrder.customer_name}</h3>
                <p className="text-[var(--text-secondary)]">{selectedOrder.email} • {selectedOrder.phone}</p>
              </div>
              <StatusBadge status={selectedOrder.status} type="order" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[var(--text-muted)]">Route</p>
                <p className="font-medium">{selectedOrder.origin} → {selectedOrder.destination}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Method</p>
                <p className="font-medium capitalize">{selectedOrder.shipping_method}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} className="bg-[var(--surface-muted)] p-4 rounded-lg border border-[var(--border)] flex flex-col gap-4">
              <h4 className="font-medium">Update Status</h4>
              <Select value={updateStatusData.status} onChange={e => setUpdateStatusData({...updateStatusData, status: e.target.value})}>
                {ORDER_STATUSES.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
              </Select>
              <Input placeholder="Location (optional)" value={updateStatusData.location} onChange={e => setUpdateStatusData({...updateStatusData, location: e.target.value})} />
              <Input placeholder="Note (optional)" value={updateStatusData.note} onChange={e => setUpdateStatusData({...updateStatusData, note: e.target.value})} />
              <Input type="datetime-local" value={updateStatusData.dateStr} onChange={e => setUpdateStatusData({...updateStatusData, dateStr: e.target.value})} />
              <Button type="submit" disabled={isSubmitting}>Update Status</Button>
            </form>

            <div>
              <h4 className="font-medium mb-4">Timeline</h4>
              <Timeline events={selectedOrder.order_events} />
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <Button variant="outline" onClick={handleDelete} className="text-red-600 border-red-200 hover:bg-red-50 w-full">Delete Order</Button>
            </div>
          </div>
        )}
      </EntityDrawer>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative z-50 bg-[var(--surface)] border-[var(--border)] border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] shrink-0 bg-[var(--surface)] z-10 sticky top-0">
              <div className="flex items-center gap-[12px] mb-2">
                <div className="h-[14px] w-[14px] bg-[var(--accent)]" />
                <span className="text-[14px] uppercase tracking-[0.02em] font-medium text-[var(--text)]">ADD ORDER</span>
              </div>
              <h2 className="text-2xl font-medium">Create a new order</h2>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <form id="add-order-form" onSubmit={handleCreateOrder} className="flex flex-col gap-4">
                <FormSection title="Contact Information">
                  <FormField label="Full Name" required><Input required placeholder="Enter your full name" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} /></FormField>
                  <FormField label="Company Name"><Input placeholder="Enter your company name" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} /></FormField>
                  <FormField label="Work Email" required><Input type="email" required placeholder="jane@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></FormField>
                  <FormField label="Phone Number"><Input placeholder="Enter your phone number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></FormField>
                </FormSection>

                <FormSection title="Shipment Details">
                  <FormField label="Origin" required><Input required placeholder="Enter departure city or port" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} /></FormField>
                  <FormField label="Destination" required><Input required placeholder="Enter arrival city or port" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} /></FormField>
                  <FormField label="Shipping Method" required>
                    <Select required value={formData.shipping_method} onChange={e => setFormData({...formData, shipping_method: e.target.value})}>
                      <option value="ocean">Ocean Freight</option>
                      <option value="air">Air Freight</option>
                      <option value="road">Road Freight</option>
                      <option value="multimodal">Multimodal</option>
                    </Select>
                  </FormField>
                  <FormField label="Weight (kg)"><Input type="number" min="0" step="any" placeholder="Enter weight in kg" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})} /></FormField>
                  <FormField label="Packages"><Input type="number" min="0" step="1" placeholder="Enter number of packages" value={formData.packages} onChange={e => setFormData({...formData, packages: e.target.value})} /></FormField>
                  <FormField label="Preferred Departure Date"><Input type="date" value={formData.preferred_departure_date} onChange={e => setFormData({...formData, preferred_departure_date: e.target.value})} /></FormField>
                  <FormField label="Estimated Delivery Date"><Input type="date" value={formData.estimated_delivery_date} onChange={e => setFormData({...formData, estimated_delivery_date: e.target.value})} /></FormField>
                </FormSection>

                <FormSection title="Order Details">
                  <FormField label="Cargo description"><Input placeholder="Description" value={formData.cargo_description} onChange={e => setFormData({...formData, cargo_description: e.target.value})} /></FormField>
                  <FormField label="Amount"><Input type="number" min="0" step="any" placeholder="Amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></FormField>
                  <FormField label="Currency"><Input placeholder="USD" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} /></FormField>
                  <FormField label="Linked quote ID"><Input placeholder="QT-YYYY-NNNN" value={formData.quote_ref} onChange={e => setFormData({...formData, quote_ref: e.target.value})} /></FormField>
                  <FormField label="Initial status">
                    <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      {ORDER_STATUSES.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Notes" className="col-span-1 md:col-span-2">
                    <Textarea placeholder="Additional information..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                  </FormField>
                  <label className="flex items-start gap-3 col-span-1 md:col-span-2 mt-4 cursor-pointer">
                    <Checkbox checked={formData.consent_to_contact} onChange={e => setFormData({...formData, consent_to_contact: e.target.checked})} />
                    <span className="text-base text-[var(--text-secondary)]">
                      By submitting this form, you agree to be contacted by our team regarding your shipping request.
                    </span>
                  </label>
                </FormSection>
              </form>
            </div>
            
            <div className="p-6 border-t border-[var(--border)] shrink-0 bg-[var(--surface-muted)]">
              <Button type="submit" form="add-order-form" disabled={isSubmitting} className="w-full md:w-auto">Create Order</Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
