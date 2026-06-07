import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="font-body-md text-body-md">
      {/* TopNavBar */}
      <header className="fixed top-0 z-50 w-full bg-surface dark:bg-surface border-b border-outline-variant dark:border-outline shadow-sm h-16">
        <div className="flex justify-between items-center w-full px-md md:px-lg max-w-container-max mx-auto h-full">
          <div className="flex items-center gap-xs">
            <Image src="/Teko_logo.svg" alt="Teko Logo" width={150} height={48} className="h-12 w-auto ml-2" />
          </div>
          <nav className="hidden md:flex items-center gap-md">
            <Link
              className="text-primary dark:text-primary-fixed-dim font-bold border-b-2 border-primary dark:border-primary-fixed-dim pb-1 font-body-md text-body-md"
              href="#"
            >
              Product
            </Link>
            <Link
              className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors duration-200 font-body-md text-body-md"
              href="#"
            >
              Psychologists
            </Link>
            <Link
              className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors duration-200 font-body-md text-body-md"
              href="#"
            >
              Clinics
            </Link>
            <Link
              className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors duration-200 font-body-md text-body-md"
              href="#"
            >
              Parents
            </Link>
          </nav>
          <Link href="/login">
            <button className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all">
              Login
            </button>
          </Link>
        </div>
      </header>
      
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-xl px-md md:px-lg">
          <div className="max-w-container-max mx-auto grid md:grid-cols-2 gap-lg items-center">
            <div className="z-10">
              <span className="inline-block pill-badge bg-secondary-container text-on-secondary-container mb-md">
                Pioneering PsychTech
              </span>
              <h1 className="font-display-lg text-display-lg md:text-[48px] md:leading-[56px] text-primary mb-md leading-tight">
                Clinical Insights Through Playful Experiences.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg max-w-[32rem]">
                A Teko transforma avaliações clínicas em jogos que as crianças amam, entregando dados prontos aos psicólogos antes da primeira sessão.
              </p>
              <div className="flex flex-col sm:flex-row gap-md">
                <Link href="/login">
                  <button className="bg-primary text-on-primary px-8 py-4 rounded-lg font-headline-md text-headline-md shadow-lg hover:shadow-xl transition-all active:scale-95">
                    Comece seu Teste Clínico
                  </button>
                </Link>
                <button className="border-2 border-primary text-primary px-8 py-4 rounded-lg font-headline-md text-headline-md hover:bg-primary-fixed-dim/10 transition-all">
                  How it Works
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary-container opacity-20 rounded-full blur-3xl"></div>
              {/* Note: Using remote images required next.config.ts update. Using standard img for placeholder */}
              <img
                alt="Friendly digital world for a child's game"
                className="rounded-xl shadow-2xl relative z-10 w-full transform hover:rotate-1 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_Nt7G_p4bjhZp3hrWGpEfPZXl2ZxWNDWZvmrQzjcV9znhQCq0qE40CPc-rrDCYJjyPhYfjVaRUydQN8tZ3JL2K-iZ81t4zFF8jI3UFs-GLM5ttpp4C0EgpANlDMduWnKOO3ILhJLhemm7TQMHqtvyCBh7dQm0zQXy_1nU68jY42zQYEKLum2dxTrn1vAXOuxYrt4V2u1pIGEVfbsyFnFaTGLX5sz7yVXzq6_Luxt6obFoQlb9-ASlaNT53zGOra7Yk46brJaIMaxS"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-md rounded-lg soft-shadow z-20 flex items-center gap-sm">
                <div className="bg-primary-fixed p-xs rounded-full">
                  <span className="text-primary font-bold">94%</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md">Engagement Rate</p>
                  <p className="font-headline-md text-[18px] text-primary">of kids</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Three Modules Section */}
        <section className="py-xl bg-background px-md md:px-lg">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-xl">
              <h2 className="font-headline-lg text-[32px] font-bold text-primary mb-sm">
                A Tri-Fold Ecosystem
              </h2>
              <p className="font-body-lg text-[18px] text-on-surface-variant max-w-2xl mx-auto">
                Bridging the gap between clinical rigor, child engagement, and parental peace of mind.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-md">
              {/* Child Module */}
              <div className="tonal-layer-1 p-md md:p-lg rounded-xl flex flex-col hover:border-primary hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 overflow-hidden rounded-lg mb-md">
                  <img
                    alt="Children's game interface"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_Nt7G_p4bjhZp3hrWGpEfPZXl2ZxWNDWZvmrQzjcV9znhQCq0qE40CPc-rrDCYJjyPhYfjVaRUydQN8tZ3JL2K-iZ81t4zFF8jI3UFs-GLM5ttpp4C0EgpANlDMduWnKOO3ILhJLhemm7TQMHqtvyCBh7dQm0zQXy_1nU68jY42zQYEKLum2dxTrn1vAXOuxYrt4V2u1pIGEVfbsyFnFaTGLX5sz7yVXzq6_Luxt6obFoQlb9-ASlaNT53zGOra7Yk46brJaIMaxS"
                  />
                </div>
                <h3 className="font-headline-md text-[24px] font-bold text-primary mb-sm">
                  The Playful Interface (Children)
                </h3>
                <p className="font-body-md text-[16px] text-on-surface-variant mb-md flex-grow">
                  Explain how children 5-12 engage in games that are actually clinical assessments. No clinical stress, just play—capturing raw, authentic data.
                </p>
                <div className="flex items-center gap-xs text-secondary font-label-md font-bold">
                  <span>Ages 5-12 Optimized</span>
                </div>
              </div>
              {/* Psychologist Module */}
              <div className="tonal-layer-1 p-md md:p-lg rounded-xl flex flex-col hover:border-primary hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 overflow-hidden rounded-lg mb-md">
                  <img
                    alt="Psychologist dashboard behavioral map"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfSqRCsT-Fi3gziKSEkqiJvJZSSnrSdvLAMvu5Fq2Nl7pJyTSHLokBn5pKsxUdLbplzMR6Vvt18mPvmJ0mAIchJewyR-HvebuyDLNOeWdz-p_X9-FKkQVEtLsVdZnzeYFZGEbrhh5SCYs7XWHks5LfDfFpNSuUw8Ov2HgDsK1xrAbi5I6lrzOG5IUOMBIlKNo8vD0MxDw3MkiKeyuQ7azJ_34rvWH0goDtPDM2lPgIasJWctaTIpjWO3bESmjOXQy3mbN61wpuYcpN"
                  />
                </div>
                <h3 className="font-headline-md text-[24px] font-bold text-primary mb-sm">
                  Behavioral Maps (Psychologists)
                </h3>
                <p className="font-body-md text-[16px] text-on-surface-variant mb-md flex-grow">
                  Ready data before the first session. Highlight structured behavioral maps and professional dashboards for immediate diagnostic clarity.
                </p>
                <div className="flex items-center gap-xs text-secondary font-label-md font-bold">
                  <span>Instant Insights</span>
                </div>
              </div>
              {/* Parent Module */}
              <div className="tonal-layer-1 p-md md:p-lg rounded-xl flex flex-col hover:border-primary hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 overflow-hidden rounded-lg mb-md">
                  <img
                    alt="Parental family connection panel"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDipJyT8BlCbCVti6jBVErPK1RTilpNfEGfvTYI4XlEjHNNSRbacoXz9MelfTfAwgkshACBI9w3y48FWn2_tE1LXg9RgLQOXg6adaiT2gSLh4JP1XBuU2BRUnb5uBV5R0VoSTUom71oHQ8Skq_3mVaWJp9D0vi1TlEy6Vt1aAyBVTs1P2haHtQR81bdgDndcrXLg9jPN1VbswA55sKhVw0Eel1mydiipXWNysza3cq2X6a_4BFkrw8FwCxy2DQkDUKkjeHoARwHnRPY"
                  />
                </div>
                <h3 className="font-headline-md text-[24px] font-bold text-primary mb-sm">
                  Family Connection (Parents)
                </h3>
                <p className="font-body-md text-[16px] text-on-surface-variant mb-md flex-grow">
                  Showcase clear visibility into progress without the clinical jargon. Reassuring and easy to understand reports that bring families together.
                </p>
                <div className="flex items-center gap-xs text-secondary font-label-md font-bold">
                  <span>Accessible Language</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Section (Bento Grid) */}
        <section className="py-xl px-md md:px-lg bg-surface">
          <div className="max-w-container-max mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-md h-auto md:h-[600px]">
              {/* Psychologist Box */}
              <div className="md:col-span-2 md:row-span-2 bg-primary-container text-on-primary-container p-lg rounded-xl flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <span className="text-[240px] font-black">?</span>
                </div>
                <div className="z-10">
                  <span className="pill-badge bg-primary text-on-primary mb-sm">
                    For Psychologists
                  </span>
                  <h3 className="font-display-lg text-[48px] font-bold mb-md mt-4 text-white">
                    Save hours on intake with pre-session data.
                  </h3>
                  <p className="font-body-lg text-[18px] text-primary-fixed max-w-[28rem]">
                    Enter your first session with a detailed behavioral roadmap. Our automated pre-assessment identifies key markers while the child plays, letting you focus on the human connection.
                  </p>
                </div>
              </div>
              {/* Clinic Box */}
              <div className="md:col-span-2 bg-secondary-container p-lg rounded-xl flex flex-col justify-center relative group overflow-hidden">
                <span className="pill-badge bg-secondary text-on-secondary w-fit mb-sm">
                  For Clinics
                </span>
                <h3 className="font-headline-lg text-[28px] font-bold text-on-secondary-container mb-sm mt-2">
                  Gain a competitive edge with cutting-edge PsychTech.
                </h3>
                <p className="font-body-md text-[16px] text-on-secondary-container/80">
                  Streamline workflows and increase patient satisfaction through technology that respects clinical boundaries.
                </p>
              </div>
              {/* Parent Box */}
              <div className="md:col-span-2 bg-white border border-outline-variant p-lg rounded-xl flex flex-col justify-center group relative overflow-hidden">
                <span className="pill-badge bg-primary-fixed text-on-primary-fixed-variant w-fit mb-sm">
                  For Parents
                </span>
                <h3 className="font-headline-lg text-[28px] font-bold text-primary mb-sm mt-2">
                  Finally see the progress your child is making.
                </h3>
                <p className="font-body-md text-[16px] text-on-surface-variant">
                  We bridge the gap between complex clinical data and understandable family updates. No jargon, just clarity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-xl px-md md:px-lg relative overflow-hidden">
          <div className="max-w-container-max mx-auto tonal-layer-1 rounded-xl p-lg md:p-xl flex flex-col items-center text-center relative z-10 overflow-hidden">
            <h2 className="font-display-lg text-[40px] font-bold text-primary mb-md max-w-2xl">
              Pronto para redefinir a experiência clínica pediátrica?
            </h2>
            <p className="font-body-lg text-[18px] text-on-surface-variant mb-lg max-w-[36rem]">
              Junte-se a centenas de clínicas transformando seu processo de triagem e aprofundando o relacionamento com os pacientes.
            </p>
            <Link href="/login">
              <button className="bg-secondary text-on-secondary px-10 py-5 rounded-lg font-headline-md text-headline-md hover:scale-105 transition-transform active:scale-95 shadow-lg flex items-center gap-sm">
                Comece seu Teste Clínico
              </button>
            </Link>
            <p className="mt-md font-caption text-[12px] text-on-surface-variant">
              No credit card required for 14-day trial.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container dark:bg-surface-container-highest w-full py-lg px-md md:px-lg mt-xl">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-xs">
            <Image src="/Teko_logo.svg" alt="Teko Logo" width={150} height={48} className="h-12 w-auto" />
          </div>
          <nav className="flex flex-wrap justify-center gap-md">
            <Link className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors font-body-md text-[16px]" href="#">
              Privacy Policy
            </Link>
            <Link className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors font-body-md text-[16px]" href="#">
              Terms of Service
            </Link>
            <Link className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors font-body-md text-[16px]" href="#">
              Contact Us
            </Link>
          </nav>
          <p className="text-on-surface-variant font-body-md text-[16px]">
            © 2024 Teko PsychTech. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
