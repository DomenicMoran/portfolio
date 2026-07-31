import { NotFoundPage } from "@/components/NotFoundPage";
import { de } from "@/content/de";

export const metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundPage content={de} />;
}