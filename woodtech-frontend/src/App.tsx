import { Outlet, ScrollRestoration } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ServiceStatusBanner from "./components/ServiceStatusBanner";

// Layout principal partagé par toutes les pages grand public.
function App() {
  return (
    <div className="min-h-screen bg-brand-900/95 text-white flex flex-col">
      <Navbar />
      <ServiceStatusBanner />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}

export default App;
