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
import { createQuote, updateQuote, deleteQuote } from '@/app/actions';
import { QUOTE_STATUSES } from '@/lib/status';
import { Search } from 'lucide-react';

export function QuotesClient({ initialQuotes }: { initialQuotes: any[] }) {
  const router = useRouter();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  React.useEffect(() => {
    setQuotes(initialQuotes);
  }, [initialQuotes]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '', company_name: '', work_email: '', phone_number: '',
    origin: '', destination: '', shipping_method: 'ocean',
    estimated_weight: '', preferred_departure_date: '',
    additional_details: '', consent_to_contact: true,
    status: 'new', quoted_amount: '', currency: 'USD', valid_until: '', internal_notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [updateData, setUpdateData] = useState({
    status: '', quoted_amount: '', currency: '', valid_until: '', internal_notes: ''
  });

  const filteredQuotes = quotes.filter(q => 
    q.quote_id.toLowerCase().includes(search.toLowerCase()) ||
    q.full_name.toLowerCase().includes(search.toLowerCase()) ||
    q.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    q.origin.toLowerCase().includes(search.toLowerCase()) ||
    q.destination.toLowerCase().includes(search.toLowerCase())
  );

  // KPIs
  const total = quotes.length;
  const newQuotes = quotes.filter(q => q.status === 'new').length;
  const inProgress = quotes.filter(q => ['under_review', 'rates_prepared', 'sent_to_customer'].includes(q.status)).length;
  const accepted = quotes.filter(q => q.status === 'accepted').length;

  const columns = [
    { 
      header: 'Quote ID', 
      accessorKey: 'quote_id', 
      cell: (row: any) => (
        <span 
          className="font-mono cursor-pointer hover:underline"
          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(row.quote_id); toast('Copied to clipboard'); }}
        >
          {row.quote_id}
        </span>
      ) 
    },
    { header: 'Customer', accessorKey: 'full_name', cell: (row: any) => <div><div className="font-medium text-[var(--text)]">{row.full_name}</div><div className="text-xs text-[var(--text-muted)]">{row.company_name}</div></div> },
    { header: 'Route', accessorKey: 'origin', cell: (row: any) => `${row.origin} → ${row.destination}` },
    { header: 'Method', accessorKey: 'shipping_method', cell: (row: any) => <span className="capitalize">{row.shipping_method}</span> },
    { header: 'Weight', accessorKey: 'estimated_weight' },
    { header: 'Departure', accessorKey: 'preferred_departure_date', cell: (row: any) => row.preferred_departure_date ? format(new Date(row.preferred_departure_date), 'MMM d, yyyy') : '-' },
    { header: 'Status', accessorKey: 'status', cell: (row: any) => <StatusBadge status={row.status} type="quote" /> },
    { header: 'Created', accessorKey: 'created_at', cell: (row: any) => format(new Date(row.created_at), 'MMM d, yyyy') },
  ];

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createQuote(formData);
    setIsSubmitting(false);
    
    if (res?.error) {
      toast(res.error);
    } else if (res?.success) {
      toast(`Quote created: ${res.quoteId}`);
      setIsAddModalOpen(false);
      router.refresh();
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await updateQuote(selectedQuote.id, {
      status: updateData.status,
      quoted_amount: updateData.quoted_amount ? parseFloat(updateData.quoted_amount) : null,
      currency: updateData.currency,
      valid_until: updateData.valid_until || null,
      internal_notes: updateData.internal_notes
    });
    setIsSubmitting(false);
    
    if (res?.error) {
      toast(res.error);
    } else {
      toast('Quote updated');
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this quote?')) {
      const res = await deleteQuote(selectedQuote.id);
      if (res?.error) toast(res.error);
      else {
        toast('Quote deleted');
        router.refresh();
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto flex-1 mr-4">
          <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-sm"><div className="text-[var(--text-secondary)] text-sm">Total Quotes</div><div className="text-2xl font-medium">{total}</div></div>
          <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-sm"><div className="text-[var(--text-secondary)] text-sm">New</div><div className="text-2xl font-medium">{newQuotes}</div></div>
          <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-sm"><div className="text-[var(--text-secondary)] text-sm">In Progress</div><div className="text-2xl font-medium">{inProgress}</div></div>
          <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] shadow-sm"><div className="text-[var(--text-secondary)] text-sm">Accepted</div><div className="text-2xl font-medium">{accepted}</div></div>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>Add quote</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
          <Input 
            placeholder="Search quotes..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-10 h-[44px]"
          />
        </div>
      </div>

      <DataTable data={filteredQuotes} columns={columns} onRowClick={(row) => {
        setSelectedQuote(row);
        setUpdateData({ 
          status: row.status, 
          quoted_amount: row.quoted_amount || '', 
          currency: row.currency || 'USD', 
          valid_until: row.valid_until || '', 
          internal_notes: row.internal_notes || '' 
        });
      }} />

      <EntityDrawer
        open={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        title={selectedQuote ? `Quote ${selectedQuote.quote_id}` : ''}
      >
        {selectedQuote && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-medium">{selectedQuote.full_name}</h3>
                <p className="text-[var(--text-secondary)]">{selectedQuote.work_email} • {selectedQuote.phone_number}</p>
              </div>
              <StatusBadge status={selectedQuote.status} type="quote" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-[var(--surface-muted)] p-4 rounded-md border border-[var(--border)]">
              <div><p className="text-[var(--text-muted)]">Route</p><p className="font-medium">{selectedQuote.origin} → {selectedQuote.destination}</p></div>
              <div><p className="text-[var(--text-muted)]">Method</p><p className="font-medium capitalize">{selectedQuote.shipping_method}</p></div>
              <div><p className="text-[var(--text-muted)]">Weight</p><p className="font-medium">{selectedQuote.estimated_weight}</p></div>
              <div><p className="text-[var(--text-muted)]">Departure</p><p className="font-medium">{selectedQuote.preferred_departure_date}</p></div>
              <div className="col-span-2"><p className="text-[var(--text-muted)]">Details</p><p className="font-medium">{selectedQuote.additional_details}</p></div>
            </div>

            <form onSubmit={handleUpdate} className="bg-[var(--surface-muted)] p-4 rounded-lg border border-[var(--border)] flex flex-col gap-4">
              <h4 className="font-medium">Update Quote</h4>
              <FormField label="Status">
                <Select value={updateData.status} onChange={e => setUpdateData({...updateData, status: e.target.value})}>
                  {QUOTE_STATUSES.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
                </Select>
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Quoted amount"><Input type="number" step="any" value={updateData.quoted_amount} onChange={e => setUpdateData({...updateData, quoted_amount: e.target.value})} /></FormField>
                <FormField label="Currency"><Input value={updateData.currency} onChange={e => setUpdateData({...updateData, currency: e.target.value})} /></FormField>
              </div>
              <FormField label="Valid until"><Input type="date" value={updateData.valid_until} onChange={e => setUpdateData({...updateData, valid_until: e.target.value})} /></FormField>
              <FormField label="Internal notes"><Textarea value={updateData.internal_notes} onChange={e => setUpdateData({...updateData, internal_notes: e.target.value})} /></FormField>
              <Button type="submit" disabled={isSubmitting}>Save</Button>
            </form>

            <div className="pt-4 border-t border-[var(--border)]">
              <Button variant="outline" onClick={handleDelete} className="text-red-600 border-red-200 hover:bg-red-50 w-full">Delete Quote</Button>
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
                <span className="text-[14px] uppercase tracking-[0.02em] font-medium text-[var(--text)]">ADD QUOTE</span>
              </div>
              <h2 className="text-2xl font-medium">Tell us what you're shipping</h2>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <form id="add-quote-form" onSubmit={handleCreateQuote} className="flex flex-col gap-4">
                <FormSection title="Contact Information">
                  <FormField label="Full Name" required><Input required placeholder="Enter your full name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} /></FormField>
                  <FormField label="Company Name"><Input placeholder="Enter your company name" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} /></FormField>
                  <FormField label="Work Email" required><Input type="email" required placeholder="jane@company.com" value={formData.work_email} onChange={e => setFormData({...formData, work_email: e.target.value})} /></FormField>
                  <FormField label="Phone Number"><Input placeholder="Enter your phone number" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></FormField>
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
                  <FormField label="Estimated Weight"><Input placeholder="Enter shipment weight" value={formData.estimated_weight} onChange={e => setFormData({...formData, estimated_weight: e.target.value})} /></FormField>
                  <FormField label="Preferred Departure Date"><Input type="date" value={formData.preferred_departure_date} onChange={e => setFormData({...formData, preferred_departure_date: e.target.value})} /></FormField>
                </FormSection>

                <FormSection title="Additional Details">
                  <FormField label="Tell us about your shipment" className="col-span-1 md:col-span-2">
                    <Textarea placeholder="Add any additional information, special requirements, or delivery instructions." value={formData.additional_details} onChange={e => setFormData({...formData, additional_details: e.target.value})} />
                  </FormField>
                  <label className="flex items-start gap-3 col-span-1 md:col-span-2 mt-4 cursor-pointer">
                    <Checkbox required checked={formData.consent_to_contact} onChange={e => setFormData({...formData, consent_to_contact: e.target.checked})} />
                    <span className="text-base text-[var(--text-secondary)]">
                      By submitting this form, you agree to be contacted by our team regarding your shipping request.
                    </span>
                  </label>
                </FormSection>

                <FormSection title="Team Use" collapsible>
                  <FormField label="Status">
                    <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      {QUOTE_STATUSES.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Quoted amount"><Input type="number" step="any" placeholder="Amount" value={formData.quoted_amount} onChange={e => setFormData({...formData, quoted_amount: e.target.value})} /></FormField>
                  <FormField label="Currency"><Input placeholder="USD" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} /></FormField>
                  <FormField label="Valid until"><Input type="date" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} /></FormField>
                  <FormField label="Internal notes" className="col-span-1 md:col-span-2"><Textarea placeholder="Notes..." value={formData.internal_notes} onChange={e => setFormData({...formData, internal_notes: e.target.value})} /></FormField>
                </FormSection>
              </form>
            </div>
            
            <div className="p-6 border-t border-[var(--border)] shrink-0 bg-[var(--surface-muted)]">
              <Button type="submit" form="add-quote-form" disabled={isSubmitting} className="w-full md:w-auto">Add Quote</Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
