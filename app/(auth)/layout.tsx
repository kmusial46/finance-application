import Image from "next/image";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen w-full justify-between font-inter">
        {children}
        <div className="auth-asset">
          <div className="relative w-full h-full">
            <Image
              src="/icons/auth-image.svg"
              alt="auth image"
              fill
              className="object-cover"
            />
          </div>
        </div>
    </main>
  );
}
