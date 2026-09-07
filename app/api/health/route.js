import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({ok:true,app:"FOT10",version:"0.1.0",status:"ready"});}
