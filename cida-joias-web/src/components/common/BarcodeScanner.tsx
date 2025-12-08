'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScanSuccess, onScanFailure, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Configuração para ler códigos de barras de produtos (EAN) e logística (128)
    const formatsToSupport = [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 }, // Área de foco
      aspectRatio: 1.0,
      formatsToSupport: formatsToSupport,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      },
      rememberLastUsedCamera: true
    };

    // ID do elemento HTML onde o scanner será renderizado
    const elementId = "html5qr-code-full-region";

    // Instancia o scanner (apenas se não existir)
    if (!scannerRef.current) {
        try {
            const scanner = new Html5QrcodeScanner(elementId, config, false);
            scannerRef.current = scanner;
    
            scanner.render(
                (decodedText) => {
                    // Sucesso: para o scanner e chama o callback
                    // scanner.clear(); // Opcional: parar após ler
                    onScanSuccess(decodedText);
                },
                (errorMessage) => {
                    // Falha na leitura (ocorre a cada frame que não acha código)
                    if (onScanFailure) onScanFailure(errorMessage);
                }
            );
        } catch (err) {
            setError("Erro ao iniciar câmera. Verifique permissões HTTPS.");
            console.error(err);
        }
    }

    // Cleanup: Limpar ao desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [onScanSuccess, onScanFailure]);

  return (
    <div className="relative border rounded-lg overflow-hidden bg-black">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>
      
      {error && <div className="text-red-500 p-4 text-center">{error}</div>}
      
      {/* Container onde a biblioteca injeta o vídeo */}
      <div id="html5qr-code-full-region" className="w-full" />
      
      <p className="text-center text-xs text-gray-400 p-2">
        Aponte a câmera para o código de barras
      </p>
    </div>
  );
}