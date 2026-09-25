"use client";

import React, { useState } from "react";
import { Download, Smartphone, Share2, PlusSquare, CheckCircle, X, Sparkles } from "lucide-react";

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
  isInstallable: boolean;
  isInstalled: boolean;
}

export function PWAInstallModal({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isInstalled,
}: PWAInstallModalProps) {
  const [isIOS] = useState(() => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    }
    return false;
  });

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bezel-shell w-full max-w-md flex flex-col animate-modal-in shadow-2xl"
      >
        <div className="bezel-core p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <div className="h-full w-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Instalar IronTracker</h3>
                <p className="text-xs text-slate-400">Aplicativo nativo no celular ou desktop</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">App já instalado!</p>
              <p className="text-xs text-slate-400">
                Você já está utilizando a versão autônoma com funcionamento offline do IronTracker.
              </p>
            </div>
          ) : isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-2 text-xs text-slate-300">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Share2 className="h-4 w-4 text-emerald-400" /> Como instalar no iPhone/iPad:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
                  <li>
                    Toque no botão <strong className="text-slate-200">Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Safari.
                  </li>
                  <li>
                    Role as opções e toque em <strong className="text-slate-200">&ldquo;Adicionar à Tela de Início&rdquo;</strong>.
                  </li>
                  <li>
                    Confirme no canto superior direito tocando em <strong className="text-emerald-400">&ldquo;Adicionar&rdquo;</strong>.
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-300 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Benefícios no iPhone:
                </p>
                <p className="text-slate-400">
                  Tela cheia sem barras de navegação, carregamento ultra-rápido instantâneo na academia e armazenamento local autônomo.
                </p>
              </div>
            </div>
          ) : (
            /* Android / Chrome / Edge */
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <PlusSquare className="h-4 w-4 text-emerald-400" />
                  <span>Por que instalar no celular?</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>Acesso com 1 toque na tela inicial</li>
                  <li>Funciona 100% offline mesmo sem sinal na academia</li>
                  <li>Sincronização automática em segundo plano</li>
                  <li>Experiência nativa em tela cheia sem abas</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const success = await onInstall();
                  if (success) onClose();
                }}
                disabled={!isInstallable}
                className="w-full py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.3)] transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{isInstallable ? "Instalar Aplicativo Agora" : "Instalação Pronta no Navegador"}</span>
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-white/5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
