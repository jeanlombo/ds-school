"use client";
import { Printer } from "lucide-react";
import { useState } from "react";
import { enregistrerReimpression } from "../actions";
export default function BoutonImprimer({documentId}:{documentId:number}){
  const [charge,setCharge]=useState(false);
  async function imprimer(){try{setCharge(true);await enregistrerReimpression(documentId,"A4");window.print();}finally{setCharge(false)}}
  return <button type="button" onClick={imprimer} disabled={charge}><Printer size={17}/>{charge?"Préparation...":"Imprimer A4"}</button>;
}
