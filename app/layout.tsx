import "./globals.css";

export const metadata = {
  title: "Delecti",
  description: "Journal & booking for hundebehandlinger"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>
        <div className="nav">
          <div className="nav-inner">
            <div className="brand">Delecti</div>
            <a className="pill" href="/">Dashboard</a>
            <a className="pill" href="/customers">Kunder</a>
            <a className="pill" href="/bookings">Kalender</a>
            <a className="pill" href="/login">Login</a>
          </div>
        </div>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
