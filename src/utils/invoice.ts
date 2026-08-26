import { Customer } from '../types';

export interface PaymentChannelItem {
  name: string;
  accountNumber?: string;
  accountHolder?: string;
  type?: string;
}

export const DEFAULT_PAYMENT_CHANNELS: PaymentChannelItem[] = [
  { name: 'Transfer Kantor (BCA)', accountNumber: '1234567890', accountHolder: 'PT ISP EONET', type: 'bank_transfer' },
  { name: 'Transfer Kantor (Mandiri)', accountNumber: '0987654321', accountHolder: 'PT ISP EONET', type: 'bank_transfer' },
  { name: 'Tunai / Cash Kantor', accountNumber: '-', accountHolder: 'Kasir Kantor', type: 'cash' },
  { name: 'MMS', accountNumber: 'MMS-PAY', accountHolder: 'MMS Channel', type: 'digital_channel' },
  { name: 'SIS BRO', accountNumber: 'SISBRO-PAY', accountHolder: 'SIS BRO Channel', type: 'digital_channel' },
  { name: 'QRIS Kantor', accountNumber: 'NMID12345678', accountHolder: 'PT ISP EONET', type: 'qris' },
];

export const generateInvoiceNumber = (customer: Customer, date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const cleanId = customer.id.replace(/[^a-zA-Z0-9]/g, '');
  return `INV/${year}/${month}/${cleanId}`;
};

export const formatCurrency = (amount: number): string => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

export const generateBillingWhatsAppMessage = (
  customer: Customer,
  invoiceNumber: string,
  channels: PaymentChannelItem[] = DEFAULT_PAYMENT_CHANNELS,
): string => {
  const activeUntil = customer.serviceActiveUntil || customer.billingDueDate || '-';
  const fee = formatCurrency(customer.monthlyFee);

  const bankText = channels
    .map((c) => `• ${c.name}${c.accountNumber && c.accountNumber !== '-' ? `: ${c.accountNumber} a/n ${c.accountHolder}` : ''}`)
    .join('\n');

  return `*TAGIHAN INTERNET EONET - INVOICE ${invoiceNumber}*
Halo Kak *${customer.name}*,

Berikut rincian tagihan layanan internet Anda untuk periode 30 hari ke depan:

📄 *No. Invoice:* ${invoiceNumber}
👤 *ID Pelanggan:* ${customer.id}
📦 *Paket Layanan:* ${customer.packagePlan}
📅 *Jatuh Tempo / Masa Aktif:* ${activeUntil}
💰 *Total Tagihan:* *${fee}*

💳 *Metode / Channel Pembayaran Resmi:*
${bankText}

Setelah melakukan pembayaran, mohon kirimkan bukti transfer / konfirmasi pembayaran agar masa aktif paket Anda langsung diperpanjang.

Terima kasih telah menggunakan layanan Eonet Fiber Internet! 🙏`;
};
