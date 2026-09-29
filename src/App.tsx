import { Header } from "./components/Header";
import { Hero } from "./components/hero/Hero";
import { About } from "./components/sections/About";
import { Team } from "./components/sections/Team";
import { Reports } from "./components/sections/Reports";
import { Development } from "./components/sections/Development";
import { Footer } from "./components/Footer";

export function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Team />
        <Reports />
        <Development />
      </main>
      <Footer />
    </>
  );
}
