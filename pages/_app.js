import '../styles/globals.css';
import Link from 'next/link';

export default function App({ Component, pageProps }) {
  return (
    <>
      <nav className="navbar">
        <strong>SwiftCargo Logistics</strong>
        <div>
          <Link href="/">Track Shipment</Link>
          <Link href="/admin">Admin Portal</Link>
        </div>
      </nav>
      <main className="container">
        <Component {...pageProps} />
      </main>
    </>
  );
}
