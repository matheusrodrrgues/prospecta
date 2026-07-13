import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { getDashboardData } from "@/lib/repository";

export const metadata: Metadata = { title: "Dashboard mineral", description: "Mapa interativo de ocorrências e imagens do Prospecta 4.0." };

export default async function DashboardPage() {
  return <Dashboard initialData={await getDashboardData()} />;
}
