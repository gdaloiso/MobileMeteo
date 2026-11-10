import { Card } from "@/components/card";
import { HourlyStrip } from "@/components/hourly-strip";
import type { Weather } from "@/lib/weather";

export function HourlyCard({ hourly }: { hourly: Weather["hourly"] }) {
  return (
    <Card style={{ paddingHorizontal: 4 }}>
      <HourlyStrip hours={hourly} firstIsNow />
    </Card>
  );
}
