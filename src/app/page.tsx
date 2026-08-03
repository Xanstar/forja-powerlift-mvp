import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { AccessRequestForm } from "@/components/access-request-form";
import { ForjaLogo } from "@/components/forja-logo";
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
      "Programa, publicá, registrá la ejecución y revisá desvíos con evidencia antes del próximo ajuste.",
  },
  twitter: {
    card: "summary",
    title: "Forja | Sistema operativo para powerlifting",
    description:
      "Del programa publicado al ajuste respaldado por la ejecución real.",
  },
};

const cycle = [
  {
    verb: "Programar",
    owner: "Coach",
    title: "Una versión clara antes de mover la barra.",
    text: "El coach organiza bloques, días, ejercicios y series. Puede preparar un borrador sin alterar el programa que el atleta ya está ejecutando.",
    evidence: "Borrador · versión 3",
  },
  {
    verb: "Ejecutar",
    owner: "Atleta",
    title: "La prescripción llega lista para entrenar.",
    text: "Al publicar, el atleta recibe el plan activo y registra cada serie, carga, repetición, RPE u omisión desde el teléfono.",
    evidence: "5 × 117,5 kg · RPE 8,5",
  },
  {
    verb: "Detectar",
    owner: "Forja",
    title: "La diferencia queda a la vista.",
    text: "Plan y resultado permanecen juntos. Las sesiones incompletas y diferencias registradas forman evidencia revisable, no mensajes sueltos.",
    evidence: "Objetivo 120 kg · realizado 117,5 kg",
  },
  {
    verb: "Revisar",
    owner: "Coach",
    title: "Primero, lo que requiere una decisión.",
    text: "El coach entra a una bandeja de excepciones respaldada por fechas, series y resultados existentes para decidir dónde intervenir.",
    evidence: "Revisar · serie 3",
  },
  {
    verb: "Ajustar",
    owner: "Coach",
    title: "El siguiente plan nace de lo que ocurrió.",
    text: "El ajuste vuelve al programa como una nueva versión. El historial ejecutado conserva su prescripción original y su resultado real.",
    evidence: "Nueva versión preparada",
  },
] as const;

const sceneVisuals = [
  null,
  {
    slug: "bench",
    images: [
      {
        src: "/marketing/gym-cycle/male-bench-press.webp",
        alt: "Conceptual male powerlifter completing a bench press in a competition-style gym",
      },
      {
        src: "/marketing/gym-cycle/female-bench-press.webp",
        alt: "Conceptual female powerlifter completing a bench press in a competition-style gym",
      },
    ],
    status: "Sincronizado",
    metricLabel: "Serie 03 · registrada",
    metric: "5 × 117,5 kg",
    note: "RPE 8,5 · mutación confirmada",
    caption: "La misma sesión conserva cada resultado ejecutado.",
  },
  {
    slug: "deadlift",
    images: [
      {
        src: "/marketing/gym-cycle/male-deadlift.webp",
        alt: "Conceptual male powerlifter performing a deadlift on a lifting platform",
      },
      {
        src: "/marketing/gym-cycle/female-deadlift.webp",
        alt: "Conceptual female powerlifter performing a deadlift on a lifting platform",
      },
    ],
    status: "Desvío detectado",
    metricLabel: "Prescrito / ejecutado",
    metric: "180 / 177,5 kg",
    note: "−2,5 kg · RPE +0,5",
    caption: "La diferencia aparece dentro del registro, no fuera de contexto.",
  },
  {
    slug: "review",
    images: [
      {
        src: "/marketing/gym-cycle/male-phone-review.webp",
        alt: "Conceptual male powerlifter reviewing training data on a phone after a set",
      },
      {
        src: "/marketing/gym-cycle/female-phone-review.webp",
        alt: "Conceptual female powerlifter reviewing training data on a phone after a set",
      },
    ],
    status: "Decisión del coach",
    metricLabel: "Siguiente versión",
    metric: "V4 · −2,5 kg",
    note: "Ajuste preparado · historial intacto",
    caption: "La revisión transforma evidencia en el próximo ajuste.",
  },
  null,
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
      <header className="landing-header">
        <Link href="/" className="landing-brand" aria-label="Forja, inicio">
          <ForjaLogo className="w-[132px] sm:w-[150px]" decorative />
        </Link>
        <nav aria-label="Navegación principal">
          <Link href="#como-funciona" className="landing-nav-detail">Cómo funciona</Link>
          <Link href="/hoy" className="landing-nav-detail">Atleta</Link>
          <ThemeControl />
          <Link href={coachHref} className="landing-login">
            {session ? "Abrir panel" : "Ingresar"}
          </Link>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <h1 id="landing-title">El coaching no termina al publicar el plan.</h1>
          <p>
            Forja es el sistema operativo vertical que conecta el trabajo de coaches,
            atletas y gimnasios de powerlifting en un ciclo continuo de decisiones.
          </p>
          <div className="landing-hero-actions">
            <Link href="#solicitar-acceso" className="landing-primary-cta">
              Solicitar acceso <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="#como-funciona" className="landing-text-link">Ver el ciclo completo</Link>
          </div>
        </div>

        <div className="hero-mechanism">
          <figure className="hero-athlete-pair">
            <Image
              className="hero-photo-primary"
              src="/marketing/gym-cycle/male-squat.webp"
              width={1600}
              height={900}
              sizes="(max-width: 1179px) 100vw, 25vw"
              alt="Conceptual male powerlifter performing a back squat in a competition-style gym"
              preload
            />
            <Image
              className="hero-photo-secondary"
              src="/marketing/gym-cycle/female-squat.webp"
              width={1600}
              height={900}
              sizes="(max-width: 1179px) 1px, 25vw"
              alt="Conceptual female powerlifter performing a back squat in a competition-style gym"
              loading="eager"
            />
          </figure>
          <div className="mechanism-board" aria-label="Demostración sintética del ciclo de coaching">
            <div className="mechanism-head">
              <span>Registro REG-042 · Bloque de fuerza V3</span>
              <span className="competition-stamp">Imágenes conceptuales · datos sintéticos</span>
            </div>
            <div className="mechanism-lift">
              <div><span>Ejercicio</span><strong>Sentadilla</strong></div>
              <div><span>Serie</span><strong>03</strong></div>
            </div>
            <div className="mechanism-comparison">
              <div><span>Prescrito</span><strong>5 × 120</strong><small>kg · RPE 8</small></div>
              <div className="mechanism-result"><span>Ejecutado</span><strong>5 × 117,5</strong><small>kg · RPE 8,5</small></div>
            </div>
            <div className="mechanism-decision">
              <span className="competition-stamp">Revisar</span>
              <p>La diferencia conserva el contexto necesario para el próximo ajuste.</p>
            </div>
            <div className="mechanism-track" aria-hidden="true">
              {cycle.map((step, index) => <span key={step.verb} style={{ "--step": index } as CSSProperties} />)}
            </div>
          </div>
        </div>
      </section>

      <div className="cycle-ribbon" aria-label="Ciclo operativo de Forja">
        {cycle.map((step, index) => (
          <span key={step.verb}><b>{index + 1}</b>{step.verb}</span>
        ))}
      </div>

      <section id="como-funciona" className="landing-story" aria-labelledby="story-title">
        <div className="story-intro">
          <h2 id="story-title">Un registro que avanza con el entrenamiento.</h2>
          <p>La continuidad importa porque cada decisión depende de la anterior.</p>
        </div>
        <ol className="story-scenes">
          {cycle.map((step, index) => {
            const visual = sceneVisuals[index];
            return (
              <li key={step.verb} className="story-scene">
                <div className="scene-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</div>
                <div className="scene-copy">
                  <div className="scene-owner"><span>{step.verb}</span><span>{step.owner}</span></div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
                {visual && (
                  <figure className={`story-visual story-visual-${visual.slug}`}>
                    <div className="story-photo-pair">
                      {visual.images.map((image, imageIndex) => (
                        <Image
                          key={image.src}
                          className={imageIndex === 0 ? "scene-photo-primary" : "scene-photo-secondary"}
                          src={image.src}
                          width={1600}
                          height={900}
                          sizes="(max-width: 1179px) calc(100vw - 2.5rem), 26vw"
                          alt={image.alt}
                          loading="lazy"
                        />
                      ))}
                    </div>
                    <div className="scene-product-overlay">
                      <div><span>REG-042 · Semana 04</span><strong>{visual.status}</strong></div>
                      <div><span>{visual.metricLabel}</span><strong>{visual.metric}</strong></div>
                      <p>{visual.note}</p>
                    </div>
                    <figcaption>{visual.caption}</figcaption>
                  </figure>
                )}
                <div className="scene-evidence"><span>Evidencia</span><strong>{step.evidence}</strong></div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="continuity-section" aria-labelledby="continuity-title">
        <div>
          <h2 id="continuity-title">El valor está en cerrar el ciclo.</h2>
          <p>
            Una planificación aislada describe una intención. Forja mantiene unida esa
            intención con la ejecución que la confirma, la contradice o exige revisión.
          </p>
        </div>
        <div className="continuity-board">
          <div className="continuity-row continuity-head"><span>Momento</span><span>Sin continuidad</span><span>Con Forja</span></div>
          <div className="continuity-row"><strong>Publicación</strong><span data-label="Sin continuidad">El archivo empieza a quedar atrás.</span><span data-label="Con Forja">La versión publicada sigue vigente.</span></div>
          <div className="continuity-row"><strong>Ejecución</strong><span data-label="Sin continuidad">El resultado se dispersa en mensajes.</span><span data-label="Con Forja">Cada serie queda junto a su prescripción.</span></div>
          <div className="continuity-row"><strong>Revisión</strong><span data-label="Sin continuidad">El coach reconstruye qué ocurrió.</span><span data-label="Con Forja">Las excepciones muestran evidencia existente.</span></div>
          <div className="continuity-row"><strong>Ajuste</strong><span data-label="Sin continuidad">El contexto depende de la memoria.</span><span data-label="Con Forja">La nueva versión conserva el historial.</span></div>
        </div>
      </section>

      <section className="roles-section" aria-labelledby="roles-title">
        <h2 id="roles-title">Dos experiencias. Un mismo registro.</h2>
        <div className="roles-grid">
          <article>
            <h3>Para el coach</h3>
            <ul>
              <li>Programar por bloques, semanas, días y series.</li>
              <li>Versionar borradores y publicar de forma explícita.</li>
              <li>Revisar sesiones y desvíos respaldados por evidencia.</li>
              <li>Ajustar sin reescribir la ejecución histórica.</li>
            </ul>
          </article>
          <article>
            <h3>Para el atleta</h3>
            <ul>
              <li>Activar el acceso enviado por su coach.</li>
              <li>Ver el entrenamiento vigente desde el teléfono.</li>
              <li>Registrar series completadas u omitidas.</li>
              <li>Consultar progreso y marcas cargadas.</li>
            </ul>
          </article>
        </div>
        <p className="offline-note">
          <strong>Conectividad:</strong> el registro admite una cola sin conexión parcial.
          Algunas acciones todavía requieren conexión y los conflictos deben resolverse al sincronizar.
        </p>
      </section>

      <section id="solicitar-acceso" className="access-section" aria-labelledby="access-title">
        <div className="access-copy">
          <h2 id="access-title">Llevá el ciclo completo a tu operación.</h2>
          <p>
            Contanos si trabajás como coach o gimnasio. Revisaremos la solicitud y te
            contactaremos por correo electrónico para continuar.
          </p>
        </div>
        <AccessRequestForm />
      </section>

      <footer className="landing-footer">
        <ForjaLogo className="w-[132px] sm:w-[150px]" />
        <p>Sistema operativo para coaches y gimnasios de powerlifting.</p>
        <div><Link href="/activar">Activar acceso</Link><Link href={coachHref}>{session ? "Abrir panel" : "Ingresar"}</Link></div>
      </footer>
    </main>
  );
}
