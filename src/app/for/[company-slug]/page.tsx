import type { Metadata } from "next";
import { SitePage } from "@/components/SitePage";
import { TargetedLanding } from "@/components/targeted/TargetedLanding";
import { de } from "@/content/de";
import { targetedPageCopy } from "@/content/targeted-page";
import { getTargetedCompany } from "@/lib/targeted-companies";
import { site } from "@/content/site";
import { mailAdresse } from "@/lib/mailto";
export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ "company-slug": string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const slug=(await params)["company-slug"], company=await getTargetedCompany(slug);
 if (!company) return { title: targetedPageCopy.fallbackTitle, description: targetedPageCopy.fallbackDescription };
 const title=`${company.company_name} × Domenic Moran`, description=`Persönliche Product-Engineering-Seite für ${company.company_name}.`;
 return { metadataBase: new URL(site.url), title, description, alternates:{canonical:`/for/${company.slug}`}, openGraph:{title,description,type:"website",url:`/for/${company.slug}`,images:[{url:`/for/${company.slug}/opengraph-image`,width:1200,height:630,alt:title}]},twitter:{card:"summary_large_image",title,description,images:[`/for/${company.slug}/opengraph-image`]},robots:{index:false,follow:false} };
}
export default async function TargetedCompanyPage({ params }: Props) {
 const company=await getTargetedCompany((await params)["company-slug"]); if(!company)return <SitePage content={de}/>;
 const mailto=mailAdresse(site.email, `Product Engineering bei ${company.company_name}`);
 return <TargetedLanding company={company} mailto={mailto} />;
}

