export default function AuthLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center pt-10 px-6">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}