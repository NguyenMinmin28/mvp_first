import dynamic from "next/dynamic";

const Loader = dynamic(
  () => import("@/features/shared/components/ClevrsLoader"),
  { ssr: false }
);

export default function Loading() {
  return <Loader />
}
