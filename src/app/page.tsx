import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { AccessRequestForm } from "@/components/access-request-form";
import { ForjaLogo } from "@/components/forja-logo";
import { LandingRevealController } from "@/components/landing-reveal-controller";
import { ThemeControl } from "@/components/theme-control";

export const metadata: Metadata = {
  title: "Forja | Sistema operativo para coaches de powerlifting",
  description:
    "Conectá programación, ejecución, detección de desvíos, revisión y ajuste en un ciclo operativo diseñado para coaches y gimnasios de powerlifting.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Forja",
    title: "Forja | Coaching de powerlifting en un ciclo continuo",
    description:
      "Programá, publicá, registrá la ejecución y revisá desvíos con evidencia antes del próximo ajuste.",
  },
  twitter: {
    card: "summary",
    title: "Forja | Sistema operativo para powerlifting",
    description:
      "Del programa publicado al ajuste respaldado por la ejecución real.",
  },
};

const imageRoot = "/marketing/forja-originals";
const imageSizes =
  "(max-width: 767px) calc(100vw - 2rem), (max-width: 1099px) calc(100vw - 5rem), 700px";

const cycle = [
  {
    verb: "Programar",
    owner: "Coach",
    title: "Una versión clara antes de mover la barra.",
    text: "El coach prepara el próximo bloque sin modificar el programa que el atleta está ejecutando. Publicar sigue siendo una decisión explícita.",
    evidence: "Borrador · versión 3",
    image: `${imageRoot}/female-squat.png`,
    alt: "Atleta de powerlifting preparada para una sentadilla en una plataforma de competencia",
  },
  {
    verb: "Ejecutar",
    owner: "Atleta",
    title: "La prescripción llega lista para entrenar.",
    text: "El atleta consulta el plan activo y registra series, carga, repeticiones, RPE u omisiones desde el teléfono.",
    evidence: "5 × 117,5 kg · RPE 8,5",
    image: `${imageRoot}/male-bench.png`,
    alt: "Atleta ejecutando press de banca con asistencia en una sala de powerlifting",
  },
  {
    verb: "Detectar",
    owner: "Forja",
    title: "La diferencia aparece dentro del registro.",
    text: "La prescripción y el resultado permanecen juntos. Una carga distinta o una serie omitida conserva fecha, contexto y estado.",
    evidence: "Objetivo 180 kg · realizado 177,5 kg",
    image: `${imageRoot}/male-deadlift.png`,
    alt: "Atleta completando un peso muerto sobre una plataforma de powerlifting",
  },
  {
    verb: "Revisar",
    owner: "Coach",
    title: "Primero, lo que requiere una decisión.",
    text: "El coach revisa la excepción con el resultado real a la vista, sin reconstruir la sesión desde mensajes o planillas separadas.",
    evidence: "Revisar · serie 3",
    image: `${imageRoot}/female-review.png`,
    alt: "Atleta revisando el registro de entrenamiento en su teléfono junto a la plataforma",
  },
  {
    verb: "Ajustar",
    owner: "Coach",
    title: "El próximo plan nace de lo que ocurrió.",
    text: "El ajuste crea una nueva versión. La prescripción publicada y la ejecución histórica quedan intactas como evidencia.",
    evidence: "Nueva versión preparada",
    image: `${imageRoot}/female-bench.png`,
    alt: "Atleta ejecutando press de banca en una sala de powerlifting",
  },
] as const;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Forja",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "es",
  description:
    "Sistema operativo vertical para coaches y gimnasios de powerlifting que conecta programación, ejecución, revisión y ajuste.",
  audience: {
    "@type": "Audience",
    audienceType: "Coaches y gimnasios de powerlifting",
  },
};

export default async function RootPage() {
  const session = await auth();
  const coachHref = session ? "/dashboard" : "/login";

  return (
    <main className="landing-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <LandingRevealController />

      <header className="landing-header landing-band-light" data-landing-band data-tone="light">
        <div className="landing-band-inner landing-header-inner">
          <Link href="/" className="landing-brand" aria-label="Forja, inicio">
            <ForjaLogo className="w-[132px] sm:w-[150px]" decorative />
          </Link>
          <nav aria-label="Navegación principal">
            <Link href="#evidencia" className="landing-nav-detail">Producto</Link>
            <Link href="#como-funciona" className="landing-nav-detail">Cómo funciona</Link>
            <Link href="/hoy" className="landing-nav-athlete">Atleta</Link>
            <ThemeControl />
            <Link href={coachHref} className="landing-login">
              {session ? "Abrir panel" : "Ingresar"}
            </Link>
          </nav>
        </div>
      </header>

      <section className="landing-hero landing-band-dark" data-landing-band data-tone="dark" aria-labelledby="landing-title">
        <div className="landing-band-inner landing-hero-inner" data-reveal>
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Coaching de powerlifting, de punta a punta</p>
            <h1 id="landing-title">El plan vale cuando conduce a la próxima decisión.</h1>
            <p className="landing-lede">
              Forja conecta programación, ejecución y revisión en un registro continuo para
              coaches, atletas y gimnasios de powerlifting.
            </p>
            <div className="landing-hero-actions">
              <Link href="#solicitar-acceso" className="landing-primary-cta">
                Solicitar acceso <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="#como-funciona" className="landing-text-link">Ver el ciclo completo</Link>
            </div>
          </div>

          <figure className="hero-figure">
            <Image
              src={`${imageRoot}/male-squat.png`}
              width={1672}
              height={941}
              sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1099px) calc(100vw - 5rem), 760px"
              quality={90}
              alt="Atleta ejecutando una sentadilla trasera en una plataforma de powerlifting"
              preload
            />
            <figcaption>
              <span>Una sesión. Un registro.</span>
              <span>Imágenes conceptuales · datos sintéticos</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="evidencia" className="evidence-section landing-band-light" data-landing-band data-tone="light" aria-labelledby="evidence-title">
        <div className="landing-band-inner evidence-inner" data-reveal>
          <div className="section-heading">
            <p className="landing-eyebrow">La diferencia operativa</p>
            <h2 id="evidence-title">El valor está en cerrar el ciclo.</h2>
            <p>
              Planificar no alcanza. Forja conserva lo prescrito, registra lo que ocurrió y
              deja la revisión lista para convertirse en una nueva versión.
            </p>
          </div>

          <div className="evidence-composition">
            <figure className="evidence-photo">
              <Image
                src={`${imageRoot}/female-deadlift.png`}
                width={1672}
                height={941}
                sizes={imageSizes}
                quality={90}
                alt="Atleta completando un peso muerto en una plataforma de powerlifting"
                loading="lazy"
              />
              <figcaption>La ejecución real permanece unida a la prescripción.</figcaption>
            </figure>

            <div className="evidence-board" aria-label="Comparación sintética entre plan, ejecución y revisión">
              <div className="evidence-board-head">
                <span>REG-042 · Semana 04</span>
                <span>Sentadilla · serie 03</span>
              </div>
              <dl>
                <div><dt>Plan</dt><dd>5 × 120 kg <small>RPE 8</small></dd></div>
                <div><dt>Ejecución</dt><dd>5 × 117,5 kg <small>RPE 8,5</small></dd></div>
                <div className="evidence-decision"><dt>Revisión</dt><dd>−2,5 kg <small>Ajuste requerido</small></dd></div>
              </dl>
              <p>La siguiente versión parte de evidencia registrada, no de memoria dispersa.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="cycle-section landing-band-dark" data-landing-band data-tone="dark" aria-labelledby="cycle-title">
        <div className="landing-band-inner cycle-inner">
          <div className="section-heading cycle-heading" data-reveal>
            <p className="landing-eyebrow">Cinco etapas, un mismo historial</p>
            <h2 id="cycle-title">El registro avanza con el entrenamiento.</h2>
          </div>

          <ol className="cycle-stages" aria-label="Ciclo operativo de Forja">
            {cycle.map((step, index) => (
              <li key={step.verb} className="cycle-stage" data-stage={step.verb.toLowerCase()} data-reveal>
                <div className="cycle-stage-copy">
                  <div className="cycle-stage-meta">
                    <span>{String(index + 1).padStart(2, "0")} / 05</span>
                    <span>{step.owner}</span>
                  </div>
                  <p className="cycle-stage-verb">{step.verb}</p>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <div className="cycle-stage-evidence">
                    <span>Evidencia</span>
                    <strong>{step.evidence}</strong>
                  </div>
                </div>
                <figure className="cycle-stage-figure">
                  <Image
                    src={step.image}
                    width={1672}
                    height={941}
                    sizes={imageSizes}
                    quality={90}
                    alt={step.alt}
                    loading="lazy"
                  />
                </figure>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="roles-section landing-band-light" data-landing-band data-tone="light" aria-labelledby="roles-title">
        <div className="landing-band-inner roles-inner" data-reveal>
          <div className="roles-copy">
            <p className="landing-eyebrow">Dos experiencias, un registro</p>
            <h2 id="roles-title">Cada persona ve lo que necesita para actuar.</h2>
            <div className="roles-columns">
              <article>
                <h3>Para el coach</h3>
                <ul>
                  <li>Preparar y publicar versiones del programa.</li>
                  <li>Revisar desvíos con la ejecución a la vista.</li>
                  <li>Ajustar sin reescribir el historial.</li>
                </ul>
              </article>
              <article>
                <h3>Para el atleta</h3>
                <ul>
                  <li>Ver el plan activo desde el teléfono.</li>
                  <li>Registrar series completadas u omitidas.</li>
                  <li>Consultar progreso y marcas cargadas.</li>
                </ul>
              </article>
            </div>
          </div>
          <figure className="roles-figure">
            <Image
              src={`${imageRoot}/male-review.png`}
              width={1672}
              height={941}
              sizes={imageSizes}
              quality={90}
              alt="Atleta revisando información de entrenamiento en su teléfono después de una serie"
              loading="lazy"
            />
            <figcaption>El mismo historial acompaña la ejecución y la revisión.</figcaption>
          </figure>
        </div>
      </section>

      <aside className="trust-section landing-band-dark" data-landing-band data-tone="dark" aria-labelledby="trust-title">
        <div className="landing-band-inner trust-inner" data-reveal>
          <div>
            <p className="landing-eyebrow">Alcance honesto</p>
            <h2 id="trust-title">La conectividad parcial no se disfraza de offline total.</h2>
          </div>
          <p>
            El registro admite una cola sin conexión parcial. Algunas acciones todavía
            requieren conexión y los conflictos deben resolverse al sincronizar. Las imágenes
            y los datos de esta página son demostraciones conceptuales, no resultados de clientes.
          </p>
        </div>
      </aside>

      <section id="solicitar-acceso" className="access-section landing-band-light" data-landing-band data-tone="light" aria-labelledby="access-title">
        <div className="landing-band-inner access-inner" data-reveal>
          <div className="access-copy">
            <p className="landing-eyebrow">Acceso inicial</p>
            <h2 id="access-title">Llevá el ciclo completo a tu operación.</h2>
            <p>
              Contanos si trabajás como coach o gimnasio. Revisaremos la solicitud y te
              contactaremos por correo electrónico para continuar.
            </p>
          </div>
          <AccessRequestForm />
        </div>
      </section>

      <footer className="landing-footer landing-band-dark" data-landing-band data-tone="dark">
        <div className="landing-band-inner landing-footer-inner" data-reveal>
          <ForjaLogo className="w-[132px] sm:w-[150px]" onDark />
          <p>Sistema operativo para coaches y gimnasios de powerlifting.</p>
          <nav aria-label="Navegación de pie de página">
            <Link href="/hoy">Atleta</Link>
            <Link href="/activar">Activar acceso</Link>
            <Link href={coachHref}>{session ? "Abrir panel" : "Ingresar"}</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
