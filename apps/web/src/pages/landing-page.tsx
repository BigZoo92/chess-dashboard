import { useState } from 'react';
import { BarChart3, ChevronDown, Gauge, Globe2, Lock, Rocket, Users2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Rocket,
    title: 'Mise en ligne instantanee',
    description: 'Publiez de nouvelles campagnes en quelques clics, sans frictions ni temps mort.'
  },
  {
    icon: Gauge,
    title: 'Performance en direct',
    description: 'Suivez les signaux critiques en temps reel et ajustez vos actions immediatement.'
  },
  {
    icon: Lock,
    title: 'Confidentialite native',
    description: 'Vos donnees restent sous controle avec des choix respectueux de la vie privee.'
  },
  {
    icon: Globe2,
    title: 'Open data connecte',
    description: 'Croisez vos sources internes avec des donnees publiques fiables et exploitables.'
  },
  {
    icon: BarChart3,
    title: 'Insights actionnables',
    description: 'Des KPIs lisibles et priorises pour decider vite, sans surcharge d information.'
  },
  {
    icon: Users2,
    title: 'Collaboration claire',
    description: 'Une vue partagee pour les equipes produit, ops et business sur un meme flux.'
  }
];

const stats = [
  { value: '12 min', label: 'pour deployer un workspace' },
  { value: '99.95%', label: 'de disponibilite en moyenne' },
  { value: '-34%', label: 'de temps passe sur le reporting' }
];

const pricing = [
  {
    name: 'Free',
    price: '0 EUR',
    subtitle: 'Pour demarrer proprement',
    items: ['1 workspace', 'Tableau de bord essentiel', 'Support communautaire'],
    cta: 'Commencer gratuitement',
    highlighted: false
  },
  {
    name: 'Pro',
    price: '29 EUR',
    subtitle: 'Par utilisateur / mois',
    items: ['Workspaces illimites', 'Automatisations avancees', 'Support prioritaire'],
    cta: 'Choisir Pro',
    highlighted: true
  },
  {
    name: 'Team',
    price: '79 EUR',
    subtitle: 'Par equipe / mois',
    items: ['Gouvernance multi-equipe', 'SSO et roles avances', 'Accompagnement dedie'],
    cta: 'Contacter les ventes',
    highlighted: false
  }
];

const faqItems = [
  {
    id: 'faq-1',
    question: 'A qui s adresse la plateforme ?',
    answer:
      'Aux equipes produit, operationnelles et data qui veulent piloter leurs actions depuis une interface unique.'
  },
  {
    id: 'faq-2',
    question: 'Combien de temps pour la prise en main ?',
    answer:
      'La majorite des equipes sont autonomes en moins d une journee grace aux templates et aux onboarding guides.'
  },
  {
    id: 'faq-3',
    question: 'Puis-je connecter mes outils existants ?',
    answer:
      'Oui, vous pouvez brancher vos sources internes et API pour centraliser vos flux sans migration lourde.'
  },
  {
    id: 'faq-4',
    question: 'Que contient le plan Pro ?',
    answer:
      'Le plan Pro ajoute les automatisations, les tableaux avances et un support prioritaire avec SLA.'
  },
  {
    id: 'faq-5',
    question: 'Mes donnees sont-elles revendues ?',
    answer: 'Non. Notre positionnement est privacy-friendly: vos donnees restent les votres.'
  }
];

export function LandingPage() {
  return (
    <div className="dark min-h-screen bg-[#0f1411] text-stone-100 [font-family:'Space_Grotesk','Manrope','Segoe_UI',sans-serif]">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(52,211,153,0.2),transparent_42%),radial-gradient(circle_at_82%_4%,rgba(245,240,224,0.12),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(20,29,24,0.92),rgba(10,14,12,1))]" />

        <header className="sticky top-0 z-50 border-b border-stone-300/10 bg-[#0d120f]/80 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
            <a
              href="#top"
              className="text-sm font-semibold tracking-[0.22em] text-stone-100 uppercase"
            >
              EcoConception
            </a>
            <nav className="hidden items-center gap-6 text-sm text-stone-300 md:flex">
              <a href="#features" className="transition-colors hover:text-stone-100">
                Features
              </a>
              <a href="#stats" className="transition-colors hover:text-stone-100">
                Stats
              </a>
              <a href="#pricing" className="transition-colors hover:text-stone-100">
                Pricing
              </a>
              <a href="#faq" className="transition-colors hover:text-stone-100">
                FAQ
              </a>
            </nav>
            <Button
              size="sm"
              onClick={() => {
                window.location.href = '/dashboard';
              }}
              className="bg-emerald-400 text-[#102117] hover:bg-emerald-300 focus-visible:ring-emerald-300"
            >
              Open Dashboard
            </Button>
          </div>
        </header>

        <main id="top">
          <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-stone-300/10">
            <img
              src="/images/chess-hero.jpeg"
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c120e] via-[#0c120e]/72 to-[#1b241f]/36" />
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.25)_0.6px,transparent_0.6px)] [background-size:3px_3px]" />

            <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1.15fr_0.85fr] md:items-end md:py-28">
              <div className="space-y-7">
                <Badge className="border-emerald-300/35 bg-emerald-300/15 px-3 py-1 text-emerald-100">
                  Plateforme produit next-gen
                </Badge>
                <div className="space-y-4">
                  <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-stone-100 md:text-6xl">
                    Lancez, mesurez et optimisez vos actions en un seul cockpit.
                  </h1>
                  <p className="max-w-xl text-base text-stone-300 md:text-lg">
                    Une landing simple, des insights nets, et des decisions qui avancent vite. Moins
                    de bruit, plus d impact.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    onClick={() => {
                      window.location.href = '/';
                    }}
                    className="bg-emerald-400 text-[#102117] shadow-[0_12px_35px_rgba(16,185,129,0.3)] transition-transform hover:-translate-y-0.5 hover:bg-emerald-300"
                  >
                    Ouvrir le dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="border-stone-300/25 bg-stone-200/5 text-stone-100 transition-colors hover:bg-stone-100/10"
                  >
                    Voir les fonctionnalites
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-emerald-300/35 bg-emerald-300/10 text-emerald-100">
                    Fast
                  </Badge>
                  <Badge className="border-lime-300/30 bg-lime-300/10 text-lime-100">
                    Open data
                  </Badge>
                  <Badge className="border-stone-200/30 bg-stone-200/10 text-stone-200">
                    Privacy-friendly
                  </Badge>
                </div>
              </div>

              <Card className="border-stone-200/20 bg-[#f5f0e0]/8 text-stone-100 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1">
                <CardHeader>
                  <CardDescription className="text-stone-300">Pulse instantane</CardDescription>
                  <CardTitle className="text-3xl text-stone-100">
                    +18% de conversion en 6 semaines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-stone-300">
                  <div className="rounded-md border border-stone-200/20 bg-[#111914]/70 p-4">
                    Vue unifiee des KPIs, alerts intelligentes et suivi continu des objectifs
                    critiques.
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-stone-200/20 bg-stone-100/[0.03] p-3">
                      <p className="text-xs uppercase tracking-wide text-stone-400">
                        Delai de reaction
                      </p>
                      <p className="mt-1 text-lg font-semibold text-stone-100">x2 plus rapide</p>
                    </div>
                    <div className="rounded-md border border-stone-200/20 bg-stone-100/[0.03] p-3">
                      <p className="text-xs uppercase tracking-wide text-stone-400">
                        Charge operationnelle
                      </p>
                      <p className="mt-1 text-lg font-semibold text-stone-100">-34%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="mx-auto max-w-6xl px-6">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-200/25 to-transparent" />
          </div>

          <section id="features" className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-10 max-w-2xl space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-400">Features</p>
              <h2 className="text-3xl font-semibold tracking-tight text-stone-100 md:text-4xl">
                Tout ce qu il faut pour accelerer proprement.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.title}
                    className="border-stone-200/10 bg-[#141b17] text-stone-100 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/40 hover:bg-[#1a221d]"
                  >
                    <CardHeader className="space-y-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200/15 bg-[#0f1511]/70">
                        <Icon className="h-5 w-5 text-emerald-300" aria-hidden />
                      </div>
                      <CardTitle className="text-xl text-stone-100">{feature.title}</CardTitle>
                      <CardDescription className="text-stone-300">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </section>

          <section id="stats" className="mx-auto max-w-6xl space-y-5 px-6 pb-20">
            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="border-stone-200/10 bg-[#121914]/75 text-stone-100"
                >
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-4xl text-stone-100">{stat.value}</CardTitle>
                    <CardDescription className="text-stone-300">{stat.label}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Card className="border-stone-200/10 bg-gradient-to-r from-[#121914] to-[#18211b] text-stone-100">
              <CardContent className="p-6 md:p-8">
                <p className="text-lg leading-relaxed text-stone-100 md:text-xl">
                  "On est passes d une vue eclatee a un pilotage net. L equipe voit les memes
                  signaux et decide en quelques minutes."
                </p>
                <p className="mt-4 text-sm text-stone-400">Claire M. - Head of Product, NovaGrid</p>
              </CardContent>
            </Card>
          </section>

          <section id="pricing" className="mx-auto max-w-6xl px-6 pb-20">
            <div className="mb-10 max-w-2xl space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-400">Pricing</p>
              <h2 className="text-3xl font-semibold tracking-tight text-stone-100 md:text-4xl">
                Des offres simples qui suivent votre rythme.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {pricing.map((plan) => (
                <Card
                  key={plan.name}
                  className={cn(
                    'flex flex-col border-stone-200/10 bg-[#141b17] text-stone-100',
                    plan.highlighted &&
                      'border-emerald-300/45 bg-emerald-400/10 shadow-xl shadow-emerald-950/30'
                  )}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl text-stone-100">{plan.name}</CardTitle>
                      {plan.highlighted ? (
                        <Badge className="border-emerald-200/35 bg-emerald-300/20 text-emerald-100">
                          Populaire
                        </Badge>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-3xl font-semibold text-stone-100">{plan.price}</p>
                      <CardDescription className="mt-1 text-stone-300">
                        {plan.subtitle}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-6">
                    <ul className="space-y-2 text-sm text-stone-300">
                      {plan.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span
                            className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300"
                            aria-hidden
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="/"
                      className={cn(
                        buttonVariants({ variant: plan.highlighted ? 'default' : 'outline' }),
                        'w-full',
                        plan.highlighted
                          ? 'bg-emerald-400 text-[#102117] hover:bg-emerald-300'
                          : 'border-stone-300/25 bg-transparent text-stone-100 hover:bg-stone-100/10'
                      )}
                    >
                      {plan.cta}
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section id="faq" className="mx-auto max-w-4xl px-6 pb-20">
            <div className="mb-8 space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-400">FAQ</p>
              <h2 className="text-3xl font-semibold tracking-tight text-stone-100 md:text-4xl">
                Questions frequentes
              </h2>
            </div>
            <FaqAccordion items={faqItems} />
          </section>
        </main>

        <footer className="border-t border-stone-200/10">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-stone-400 md:flex-row">
            <p>EcoConception (c) 2026</p>
            <div className="flex items-center gap-4">
              <a href="#features" className="transition-colors hover:text-stone-200">
                Features
              </a>
              <a href="#pricing" className="transition-colors hover:text-stone-200">
                Pricing
              </a>
              <a href="#faq" className="transition-colors hover:text-stone-200">
                FAQ
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FaqAccordion({
  items
}: {
  items: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}) {
  const [openItem, setOpenItem] = useState(items[0]?.id ?? '');

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openItem === item.id;

        return (
          <Card
            key={item.id}
            className="overflow-hidden border-stone-200/10 bg-[#141b17] text-stone-100"
          >
            <button
              type="button"
              id={`${item.id}-trigger`}
              aria-expanded={isOpen}
              aria-controls={`${item.id}-content`}
              onClick={() => setOpenItem(isOpen ? '' : item.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium text-stone-100 transition-colors hover:bg-stone-100/[0.05]"
            >
              <span>{item.question}</span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 shrink-0 text-stone-300 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
                aria-hidden
              />
            </button>
            <div
              id={`${item.id}-content`}
              role="region"
              aria-labelledby={`${item.id}-trigger`}
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden px-5 pb-5 text-sm text-stone-300">{item.answer}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
