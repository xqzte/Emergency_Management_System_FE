import { URGENCY_LEVELS } from "../urgency";
import { Button } from "./Button";
import { Card } from "./Card";
import { DistanceText } from "./DistanceText";
import { Input } from "./Input";
import { UrgencyBadge } from "./UrgencyBadge";

const SWATCHES = [
  { name: "Cream", className: "bg-cream", hex: "#F7F6F2" },
  { name: "White", className: "bg-surface", hex: "#FFFFFF" },
  { name: "Yellow", className: "bg-primary", hex: "#F0DC82" },
  { name: "Gold", className: "bg-gold", hex: "#B58F00" },
  { name: "Link", className: "bg-link", hex: "#7A6200" },
  { name: "Ink", className: "bg-ink", hex: "#1F1F1B" },
  { name: "Muted", className: "bg-muted", hex: "#6B6B66" },
];

/** Screen 1: the style sheet, rendered from the real shared components. */
export function StyleSheet({ appName }: { appName: string }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4 sm:p-8">
      <header>
        <p className="text-base text-muted">{appName}</p>
        <h1 className="text-heading">Style sheet</h1>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-title">Colours</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SWATCHES.map((s) => (
            <Card key={s.name} className="flex flex-col gap-2 p-3">
              <span className={`h-12 rounded-lg border border-ink/10 ${s.className}`} />
              <span className="text-base font-semibold">{s.name}</span>
              <span className="text-base text-muted">{s.hex}</span>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-title">Type</h2>
        <Card className="flex flex-col gap-2">
          <p className="text-heading">Heading 32</p>
          <p className="text-title">Title 20</p>
          <p className="text-body">Body 16. Never smaller on phones.</p>
          <p className="text-base text-muted">Muted 16, secondary text</p>
          <a href="#" className="text-base font-semibold text-link underline">
            Link text
          </a>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-title">Urgency</h2>
        <div className="flex flex-wrap gap-3">
          {URGENCY_LEVELS.map((level) => (
            <UrgencyBadge key={level} level={level} />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {URGENCY_LEVELS.map((level) => (
            <UrgencyBadge key={level} level={level} size="lg" showDescription />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-title">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button disabled>Disabled</Button>
        </div>
        <Button fullWidth>Full width primary</Button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-title">Inputs</h2>
        <Card className="flex flex-col gap-4">
          <Input id="style-email" label="Email" type="email" placeholder="you@example.com" hint="We send a code here." />
          <Input id="style-phone" label="Phone number" type="tel" placeholder="080" error="Enter a valid phone number." />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-title">Card and distance</h2>
        <Card className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-title">Sample Hospital</span>
            <DistanceText distanceKm={1.2} minutes={6} />
          </div>
          <UrgencyBadge level="ORANGE" />
        </Card>
        <Card className="flex flex-col">
          <span className="text-title">Sample Clinic</span>
          <DistanceText distanceKm={0.8} minutes={4} />
        </Card>
      </section>
    </main>
  );
}
