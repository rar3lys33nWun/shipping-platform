import '../styles/globals.css';
import Link from 'next/link';

export default function App({ Component, pageProps }) {
  return (
    <>
      <nav className="navbar">
        <Link href="/" className="brand-logo">
          SwiftPostal Logistics <span className="brand-tag">Express</span>
        </Link>
        <div className="nav-links">
          <Link href="/">Track Shipment</Link>
          <Link href="/admin">Admin Portal</Link>
        </div>
      </nav>

      <main className="container">
        <Component {...pageProps} />
      </main>

      <footer className="footer">
        &copy; {new Date().getFullYear()} SwiftPostal Logistics. All rights reserved.
      </footer>
    </>
  );
}
