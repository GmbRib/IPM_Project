import { Header } from "./components/Header";
import { Hero } from "./components/hero/Hero";
import { About } from "./components/sections/About";
import { Team } from "./components/sections/Team";
import { Assignments } from "./components/sections/Assignments";
import { Reports } from "./components/sections/Reports";
import { Development } from "./components/sections/Development";
import { Footer } from "./components/Footer";
import { FightProvider } from "./fight/FightContext";

export function App() {
  return (
    <FightProvider>
      <Header />
      <main>
        <Hero />
        <About />
        <Team />
        <Assignments />
        <Reports />
        <Development />
      </main>
      <Footer />
    </FightProvider>
  );
}
