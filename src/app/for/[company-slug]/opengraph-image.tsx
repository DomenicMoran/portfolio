/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { getTargetedCompany } from "@/lib/targeted-companies";
import { targetedPageCopy } from "@/content/targeted-page";
export const runtime="edge"; export const alt=targetedPageCopy.ogAlt; export const size={width:1200,height:630}; export const contentType="image/png";
export default async function Image({params}:{params:Promise<{"company-slug":string}>}) {
 const company=await getTargetedCompany((await params)["company-slug"]);
 const name=company?.company_name??"Domenic Moran";
 // Most rows use the verified company domain rather than an uploaded brand file.
 // The favicon is still the company's own published visual identity, not a generated placeholder.
 const logoUrl=company?.logo_url ?? (company?.company_url ? `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(company.company_url)}` : null);
 return new ImageResponse(
  <div style={{height:"100%",width:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:72,background:"#08080a",color:"white",position:"relative",overflow:"hidden"}}>
   <div style={{position:"absolute",right:-150,top:-170,width:540,height:540,borderRadius:9999,background:"#a3ff6f22",border:"1px solid #a3ff6f55"}} />
   <div style={{position:"absolute",right:-20,top:-35,width:260,height:260,borderRadius:9999,border:"2px solid #b78cff66"}} />
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:25,color:"#a3ff6f",letterSpacing:2}}>
    <span>PERSÖNLICHE PRODUKTSEITE</span>
    {logoUrl ? <div style={{display:"flex",width:92,height:92,borderRadius:24,background:"#ffffff",padding:18,alignItems:"center",justifyContent:"center",boxShadow:"0 18px 50px #00000055"}}><img src={logoUrl} alt={`${name} logo`} width="56" height="56" style={{objectFit:"contain"}} /></div> : <div style={{display:"flex",width:92,height:92,borderRadius:24,background:"#151519",border:"1px solid #33333a",alignItems:"center",justifyContent:"center",fontSize:42,color:"#a3ff6f"}}>D</div>}
   </div>
   <div style={{display:"flex",flexDirection:"column",zIndex:1}}><div style={{display:"flex",fontSize:76,fontWeight:700,letterSpacing:-3}}>{name} ×</div><div style={{display:"flex",fontSize:56,color:"#d4d4d8",letterSpacing:-2}}>Domenic Moran</div></div>
   <div style={{display:"flex",fontSize:28,color:"#a1a1aa",letterSpacing:0.4}}>AI-Native Product Engineer&nbsp;·&nbsp;Berlin</div>
  </div>,size
 );
}

