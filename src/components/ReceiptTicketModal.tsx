import React from 'react';
import { Printer, X, CheckCircle2, Clock, Car, Tag, ShieldCheck, Download, Share2 } from 'lucide-react';
import { ParkingTicket, Language } from '../types';
import { BarcodeVisual, QrCodeVisual } from './BarcodeVisual';

interface ReceiptTicketModalProps {
  ticket: ParkingTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToCheckout?: (ticket: ParkingTicket) => void;
  lang?: Language;
}

export const ReceiptTicketModal: React.FC<ReceiptTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onGoToCheckout,
}) => {
  if (!isOpen || !ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = ticket.status === 'paid' || ticket.status === 'completed';
  const entryDateObj = new Date(ticket.entryTime);
  const formattedEntry = `${entryDateObj.toLocaleDateString('ka-GE')} • ${entryDateObj.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  const exitDateObj = ticket.exitTime ? new Date(ticket.exitTime) : ticket.paidAt ? new Date(ticket.paidAt) : null;
  const formattedExit = exitDateObj ? `${exitDateObj.toLocaleDateString('ka-GE')} • ${exitDateObj.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:max-w-none">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <h3 className="text-sm font-bold text-white">საპარკინგე ქვითარი (ტალონი)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="print-ticket-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-sm"
              title="ქვითრის დაბეჭდვა"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ბეჭდვა</span>
            </button>
            <button
              onClick={onClose}
              id="close-ticket-modal-btn"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-5 max-h-[80vh] overflow-y-auto print:p-0 print:max-h-none">
          {/* THERMAL PAPER RECEIPT CONTAINER */}
          <div className="bg-amber-50 text-slate-900 rounded-2xl p-6 shadow-inner border border-amber-200/80 relative font-sans print:border-none print:shadow-none print:p-4">
            {/* Serrated Cut Effect at Top */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[radial-gradient(circle,transparent_4px,#fffbeb_4px)] [background-size:12px_12px] opacity-90 -translate-y-1" />

            {/* Header Stamp */}
            <div className="text-center pb-4 border-b-2 border-dashed border-slate-300">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-amber-50 font-mono font-black text-xl mb-1.5">
                P
              </div>
              <h1 className="text-lg font-black tracking-tight uppercase text-slate-900">
                SMARTPARK GEORGIA
              </h1>
              <p className="text-[11px] font-mono text-slate-600 font-medium">
                ადგილზე მომსახურების ტერმინალი
              </p>
              <p className="text-[10px] font-mono text-slate-500">
                ავტომატური საპარკინგე სისტემა
              </p>
            </div>

            {/* Status Stamp if already paid */}
            {isPaid && (
              <div className="my-3 py-1 px-3 bg-emerald-100 border-2 border-emerald-600 rounded-xl text-center text-emerald-800 font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>გადახდილია • PAID</span>
              </div>
            )}

            {/* Main Info Matrix */}
            <div className="py-4 space-y-2.5 text-xs border-b-2 border-dashed border-slate-300 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold">ქვითრის №:</span>
                <span className="font-black text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {ticket.ticketId}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold">ავტომობილის ნომერი:</span>
                <span className="font-black text-base text-slate-950 tracking-wider bg-white px-2 py-0.5 rounded border-2 border-slate-900">
                  {ticket.plateNumber}
                </span>
              </div>

              {ticket.driverFullName && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">მძღოლი:</span>
                  <span className="font-bold text-slate-900">{ticket.driverFullName}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold">საპარკინგე ადგილი:</span>
                <span className="font-bold text-slate-900">
                  {ticket.spotId} პარკინგი {ticket.spotId === 'A' ? '(თანამშრომელი)' : '(ფასიანი)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold">შემოსვლის დრო:</span>
                <span className="font-bold text-slate-900">{formattedEntry}</span>
              </div>

              {formattedExit && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">გასვლის დრო:</span>
                  <span className="font-bold text-slate-900">{formattedExit}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold">ოპერატორი / სადგური:</span>
                <span className="text-slate-800">{ticket.staffOperatorName || 'ადგილზე მყოფი თანამშრომელი #01'}</span>
              </div>

              {isPaid && ticket.amountPaid !== undefined && (
                <>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-700 font-bold">გატარებული დრო:</span>
                    <span className="font-black text-slate-900">{ticket.durationFormatted || '1 სთ'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-bold">გადახდილი თანხა:</span>
                    <span className="font-black text-base text-emerald-700">
                      {ticket.amountPaid.toFixed(2)} ₾
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-bold">გადახდის მეთოდი:</span>
                    <span className="text-slate-800 font-bold">
                      {ticket.paymentMethod === 'cash'
                        ? 'ნაღდი ფული (ქეში)'
                        : ticket.paymentMethod === 'bog'
                        ? 'საქართველოს ბანკი (საქ / BOG)'
                        : ticket.paymentMethod === 'tbc'
                        ? 'თიბისი ბანკი (თიბისი / TBC)'
                        : ticket.paymentMethod === 'pos' || ticket.paymentMethod === 'card'
                        ? 'საბანკო ბარათი (POS / VISA / MC)'
                        : ticket.paymentMethod}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Official Rates Box */}
            <div className="py-3 border-b-2 border-dashed border-slate-300 text-[11px] font-mono">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-600" />
                <span>ოფიციალური ტარიფი (B პარკინგი):</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center mt-1.5">
                <div className="bg-white p-1 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500">1 საათი</div>
                  <div className="font-black text-slate-900">1.00 ₾</div>
                </div>
                <div className="bg-white p-1 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500">3 საათი</div>
                  <div className="font-black text-slate-900">2.00 ₾</div>
                </div>
                <div className="bg-white p-1 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500">24 საათი</div>
                  <div className="font-black text-slate-900">5.00 ₾</div>
                </div>
              </div>
            </div>

            {/* BARCODE & QR CODE SECTION */}
            <div className="pt-4 pb-3 flex flex-col items-center justify-center text-center">
              <div className="w-full flex items-center justify-center mb-3">
                <BarcodeVisual code={ticket.barcode} height={52} className="text-slate-950 w-full max-w-[280px]" />
              </div>

              <div className="flex items-center gap-4 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <QrCodeVisual value={ticket.ticketId} size={74} className="border-none shadow-none p-0" />
                <div className="text-left font-mono">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">QR გადამოწმება</span>
                  <span className="text-xs font-black text-slate-900 block">{ticket.ticketId}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    დაასკანერეთ გასვლისას
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Terms */}
            <div className="mt-3 pt-3 border-t border-slate-300 text-center font-mono text-[10px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">
                ⚠️ ყურადღება: შეინახეთ ქვითარი გასვლამდე!
              </p>
              <p>
                გამოსვლის დროს გადაიხდის მომხმარებელი. თანამშრომელი დაასკანერებს შტრიხკოდს/ქიუარს, თანხა დაფიქსირდება ბაზაში და შლაგბაუმი გაიღება მანუალით.
              </p>
              <p className="text-[9px] text-slate-400 pt-1">
                მადლობას გიხდით სარგებლობისთვის!
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions (Hidden on print) */}
        <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex items-center gap-3 print:hidden">
          <button
            id="print-modal-thermal-btn"
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-colors flex items-center justify-center gap-2 shadow-md shadow-teal-900/20"
          >
            <Printer className="w-4 h-4" />
            <span>ქვითრის დაბეჭდვა</span>
          </button>

          {!isPaid && onGoToCheckout && (
            <button
              id="go-to-checkout-btn"
              onClick={() => {
                onClose();
                onGoToCheckout(ticket);
              }}
              className="py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
            >
              <span>გასვლა & გადახდა ➔</span>
            </button>
          )}

          <button
            id="close-ticket-btn-secondary"
            onClick={onClose}
            className="py-3 px-4 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            დახურვა
          </button>
        </div>
      </div>
    </div>
  );
};
