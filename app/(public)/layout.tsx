import { AuthProvider } from "@/components/auth-provider";
import { Cursor } from "@/components/cursor";
import { FilmGrain } from "@/components/film-grain";
import { AmbientBlobs } from "@/components/ambient-blobs";
import { LenisProvider } from "@/components/lenis-provider";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      <LenisProvider />
      <Cursor />
      <FilmGrain />
      <AmbientBlobs />
      {children}
    </AuthProvider>
  );
}
