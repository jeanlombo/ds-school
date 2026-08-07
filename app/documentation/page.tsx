export default function DocumentationPage(){
const docs=[
{name:"Catalogue Commercial",version:"1.0",pages:"150",size:"À venir",file:"/documents/Catalogue_DS_SCHOOL_ENTERPRISE.pdf"},
{name:"Guide Utilisateur",version:"1.0",pages:"400",size:"À venir",file:"/documents/Guide_Utilisateur_DS_SCHOOL_ENTERPRISE.pdf"},
{name:"Guide Administrateur",version:"1.0",pages:"180",size:"À venir",file:"/documents/Guide_Administrateur_DS_SCHOOL_ENTERPRISE.pdf"},
];
return (
<main style={{padding:"40px",maxWidth:1200,margin:"auto"}}>
<h1>Documentation Officielle</h1>
<p>Téléchargez les documents officiels de DS SCHOOL ENTERPRISE.</p>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:"20px"}}>
{docs.map(doc=>(
<div key={doc.name} style={{border:"1px solid #ddd",borderRadius:16,padding:20}}>
<h2>{doc.name}</h2>
<p><b>Version :</b> {doc.version}</p>
<p><b>Pages :</b> {doc.pages}</p>
<p><b>Taille :</b> {doc.size}</p>
<a href={doc.file} download style={{display:"inline-block",padding:"12px 18px",background:"#1268f3",color:"#fff",borderRadius:10,textDecoration:"none"}}>Télécharger le PDF</a>
</div>
))}
</div>
</main>);
}
