import { colors } from "../theme";

export interface CustomerInfoProps {
  customer?: { name: string; email: string; phone?: string };
  compact?: boolean;
}

export default function CustomerInfo({ customer, compact }: CustomerInfoProps) {
  if (!customer) return null;

  if (compact) {
    return (
      <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
        👤 {customer.name}
        {customer.phone && <> · <a href={`tel:${customer.phone}`} style={{ color: colors.softRoyalBlue }}>{customer.phone}</a></>}
      </p>
    );
  }

  return (
    <div style={{ backgroundColor: colors.warmBeige, borderRadius: 8, padding: 14, marginTop: 12 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: colors.deepNavy, marginBottom: 8 }}>Customer</p>
      <p style={{ fontWeight: 600, color: colors.deepNavy }}>{customer.name}</p>
      <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
        <a href={`mailto:${customer.email}`} style={{ color: colors.softRoyalBlue }}>{customer.email}</a>
      </p>
      {customer.phone && (
        <p style={{ fontSize: 13, marginTop: 4 }}>
          <a href={`tel:${customer.phone}`} style={{ color: colors.softRoyalBlue }}>📞 {customer.phone}</a>
        </p>
      )}
    </div>
  );
}
