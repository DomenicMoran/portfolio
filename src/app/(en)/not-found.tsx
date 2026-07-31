import { NotFoundPage } from "@/components/NotFoundPage";
import { en } from "@/content/en";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFoundEn() {
  return <NotFoundPage content={en} base="/en" />;
}