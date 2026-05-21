import { AuthProvider } from "@/components/auth-provider";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
