/**
 * Brand SVG icons for payment methods. Monochrome, currentColor, scale with text.
 */

const card =
  "h-6 w-10 rounded-[3px] border border-current/30 grid place-items-center bg-background";

function Visa() {
  return (
    <svg viewBox="0 0 40 24" className="h-3 w-auto" fill="currentColor" aria-hidden>
      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle"
        fontFamily="Helvetica, Arial, sans-serif" fontWeight="900" fontSize="11"
        fontStyle="italic" letterSpacing="0.5">VISA</text>
    </svg>
  );
}
function Mastercard() {
  return (
    <svg viewBox="0 0 40 24" className="h-4 w-auto" aria-hidden>
      <circle cx="16" cy="12" r="6" fill="currentColor" opacity="0.85" />
      <circle cx="24" cy="12" r="6" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
function Amex() {
  return (
    <svg viewBox="0 0 40 24" className="h-3 w-auto" fill="currentColor" aria-hidden>
      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle"
        fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize="8"
        letterSpacing="0.5">AMEX</text>
    </svg>
  );
}
function Diners() {
  return (
    <svg viewBox="0 0 40 24" className="h-4 w-auto" aria-hidden>
      <circle cx="20" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M16 7 A 6 6 0 0 1 16 17 Z" fill="currentColor" />
    </svg>
  );
}
function Discover() {
  return (
    <svg viewBox="0 0 40 24" className="h-3 w-auto" aria-hidden>
      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fill="currentColor"
        fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize="7">DISCOVER</text>
    </svg>
  );
}
function Jcb() {
  return (
    <svg viewBox="0 0 40 24" className="h-3 w-auto" fill="currentColor" aria-hidden>
      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle"
        fontFamily="Helvetica, Arial, sans-serif" fontWeight="800" fontSize="9"
        letterSpacing="0.5">JCB</text>
    </svg>
  );
}
function ApplePay() {
  return (
    <svg viewBox="0 0 40 24" className="h-3 w-auto" fill="currentColor" aria-hidden>
      <path d="M9.4 8.5c-.1-1 .8-2 1.5-2.5.2 1 -.7 2.1 -1.5 2.5zm1.4 1c-.8 0-1.5.5-1.9.5-.4 0-1-.5-1.7-.5-.9 0-1.7.5-2.1 1.3-.9 1.6-.2 4 .7 5.3.4.6.9 1.3 1.6 1.3.6 0 .9-.4 1.7-.4.8 0 1 .4 1.7.4.7 0 1.1-.6 1.5-1.3.5-.7.7-1.4.7-1.5-.1 0-1.3-.5-1.3-2 0-1.2 1-1.8 1-1.8-.6-.8-1.5-.9-1.9-.9z" />
      <text x="20" y="15" fontFamily="Helvetica, Arial, sans-serif" fontWeight="600" fontSize="8">Pay</text>
    </svg>
  );
}
function GPay() {
  return (
    <svg viewBox="0 0 40 24" className="h-3 w-auto" fill="currentColor" aria-hidden>
      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle"
        fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize="7">G Pay</text>
    </svg>
  );
}

const methods = [
  { id: "visa",       label: "Visa",        Icon: Visa },
  { id: "mastercard", label: "Mastercard",  Icon: Mastercard },
  { id: "amex",       label: "American Express", Icon: Amex },
  { id: "diners",     label: "Diners Club", Icon: Diners },
  { id: "discover",   label: "Discover",    Icon: Discover },
  { id: "jcb",        label: "JCB",         Icon: Jcb },
  { id: "applepay",   label: "Apple Pay",   Icon: ApplePay },
  { id: "googlepay",  label: "Google Pay",  Icon: GPay },
] as const;

export function PaymentIcons({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`} aria-label="Accepted payment methods">
      {methods.map(({ id, label, Icon }) => (
        <li key={id} className={card} aria-label={label} title={label}>
          <Icon />
        </li>
      ))}
    </ul>
  );
}
