import { IdeaSparkHero, IdeaSparkGrid } from "@/features/ideas/components";
import { Header } from "@/features/shared/components/header";

export default function IdeasPage() {
  return (
    <div>
      <Header />
      <IdeaSparkHero />
      <IdeaSparkGrid />
    </div>
  );
}
