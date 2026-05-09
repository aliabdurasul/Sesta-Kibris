import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Map, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="gg-rise flex min-h-[calc(100vh-100px)] flex-col items-center justify-center px-6 text-center" data-testid="order-success">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#00C2A8]/10">
        <CheckCircle2 className="h-12 w-12 text-[#00C2A8]" />
      </div>

      <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[#1A1A1A]">
        Siparişiniz Alındı!
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Mağaza siparişinizi hazırlamaya başladı.
        <br />
        <span className="font-mono text-xs mt-2 inline-block bg-gray-100 px-2 py-1 rounded">Sipariş No: {id?.split('-')[0] || "SK-1234"}</span>
      </p>

      <div className="w-full max-w-sm space-y-3">
        <Button
          onClick={() => navigate(`/order-track/${id}`)}
          className="tap h-14 w-full rounded-full bg-[#6C3BFF] text-base font-bold shadow-lg hover:bg-[#582CD6]"
        >
          <Map className="mr-2 h-5 w-5" />
          Siparişimi Takip Et
        </Button>
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="tap h-14 w-full rounded-full border-[#E5E7EB] text-base font-bold text-gray-600 hover:bg-gray-50"
        >
          <Home className="mr-2 h-5 w-5" />
          Ana Sayfaya Dön
        </Button>
      </div>
    </div>
  );
}
