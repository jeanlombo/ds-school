import Link from "next/link";
import { CalendarDays, Clock3, Coffee, DoorOpen, LayoutGrid, Settings2, Shapes, SlidersHorizontal } from "lucide-react";
import RetourDashboard from "./RetourDashboard";
import styles from "./parametres-academiques.module.css";
const modules=[
 {href:"/dashboard/parametres-academiques/calendrier",titre:"Calendrier scolaire",texte:"Vacances, jours fériés, journées pédagogiques et événements.",icon:CalendarDays},
 {href:"/dashboard/parametres-academiques/periodes",titre:"Périodes académiques",texte:"Trimestres, semestres et dates d'évaluation.",icon:LayoutGrid},
 {href:"/dashboard/parametres-academiques/jours-ouvrables",titre:"Jours ouvrables",texte:"Activez les jours réellement utilisés par l'établissement.",icon:Shapes},
 {href:"/dashboard/parametres-academiques/creneaux",titre:"Créneaux horaires",texte:"Définissez les périodes de cours et leur ordre.",icon:Clock3},
 {href:"/dashboard/parametres-academiques/pauses",titre:"Récréations et pauses",texte:"Bloquez les pauses dans le futur emploi du temps.",icon:Coffee},
 {href:"/dashboard/parametres-academiques/salles",titre:"Salles de cours",texte:"Gérez classes, laboratoires, bibliothèques et capacités.",icon:DoorOpen},
 {href:"/dashboard/parametres-academiques/types-cours",titre:"Types de cours",texte:"Théorie, pratique, laboratoire, sport, examen et atelier.",icon:SlidersHorizontal},
 {href:"/dashboard/parametres-academiques/regles",titre:"Règles académiques",texte:"Contraintes et limites utilisées par le moteur d'emploi du temps.",icon:Settings2},
];
export default function Page(){return <div className={styles.page}><RetourDashboard/><section className={styles.hero}><div><span className={styles.badge}><Settings2 size={16}/> CENTRE ACADÉMIQUE</span><h1>Paramètres académiques</h1><p>Centralisez les règles qui alimenteront l'emploi du temps, les présences, les examens et les bulletins.</p></div><div className={styles.heroIcon}><Settings2 size={48}/></div></section><section className={styles.grid}>{modules.map(({href,titre,texte,icon:Icon})=><Link key={href} href={href} className={styles.card} prefetch><span className={styles.cardIcon}><Icon size={24}/></span><h2>{titre}</h2><p>{texte}</p></Link>)}</section></div>}
