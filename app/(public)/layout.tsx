import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/components/cart-provider";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
