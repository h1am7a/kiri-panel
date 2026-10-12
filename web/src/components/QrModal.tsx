import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, Smartphone, Sparkles, Download } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { soundFx } from '../utils/soundFx';
import { useMascotStore } from '../stores/useMascotStore';

export const QrModal: React.FC = () => {
  const { selectedUserForQr, closeQrModal, getMihomoSubscriptionUrl, getWireguardConfigText } = useAppStore();
  const { setMood } = useMascotStore();
  const [copied, setCopied] = useState(false);
  const [qrType, setQrType] = useState<'mihomo' | 'awg'>('mihomo');

  if (!selectedUserForQr) return null;

  const mihomoUrl = getMihomoSubscriptionUrl(selectedUserForQr.id);
  const awgConfig = getWireguardConfigText(selectedUserForQr);
  const qrValue = qrType === 'mihomo' ? mihomoUrl : awgConfig;

  const handleCopy = () => {
    soundFx.ding();
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setMood('proud', 'Ссылка успешно скопирована! Отправь её на устройство~ ✨', 4000);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadConf = () => {
    soundFx.ding();
    const element = document.createElement('a');
    const file = new Blob([awgConfig], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedUserForQr.name.toLowerCase().replace(/\s+/g, '_')}_awg.conf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setMood('proud', 'Конфигурация AmneziaWG загружена! Импортируй в клиент~ 🛡️', 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-cosmic-850 border border-cyber-cyan/40 rounded-xl p-6 shadow-neon-cyan overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cyber corner accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyber-cyan" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyber-cyan" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyber-cyan" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyber-cyan" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyber-cyan/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-white text-base">
                QR-CONNECT // {selectedUserForQr.name}
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Сканируй камерой или в приложении
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.bleep();
              closeQrModal();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 my-4 p-1 bg-cosmic-950 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => {
              soundFx.bleep();
              setQrType('mihomo');
            }}
            className={`py-2 rounded flex items-center justify-center gap-1.5 transition-all ${
              qrType === 'mihomo'
                ? 'bg-cyber-pink text-white font-bold shadow-neon-pink'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Mihomo (Universal)
          </button>
          <button
            onClick={() => {
              soundFx.bleep();
              setQrType('awg');
            }}
            className={`py-2 rounded flex items-center justify-center gap-1.5 transition-all ${
              qrType === 'awg'
                ? 'bg-cyber-cyan text-cosmic-950 font-bold shadow-neon-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            AmneziaWG (.conf)
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl my-4 shadow-inner relative group">
          <QRCodeSVG
            value={qrValue}
            size={220}
            level="M"
            includeMargin={true}
            bgColor="#FFFFFF"
            fgColor="#0B0F19"
          />
          <div className="absolute bottom-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            {qrType === 'mihomo' ? 'Auto-Update Mihomo Profile' : 'Direct AWG WireGuard Tunnel'}
          </div>
        </div>

        {/* Info & Instructions */}
        <div className="bg-cosmic-900/90 rounded-lg p-3 border border-slate-800 mb-4 text-xs font-mono text-slate-300 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Назначенный IP:</span>
            <span className="text-cyber-cyan font-bold">{selectedUserForQr.ipAddress}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Протоколы:</span>
            <span className="text-cyber-pink font-bold">AmneziaWG + Hysteria 2 Gecko</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-4 rounded-lg bg-cyber-pink/20 hover:bg-cyber-pink/30 border border-cyber-pink/50 text-cyber-pink font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-neon-pink"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span className="text-white">СКОПИРОВАНО!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>КОПИРОВАТЬ {qrType === 'mihomo' ? 'ССЫЛКУ' : 'КОНФИГ'}</span>
              </>
            )}
          </button>

          {qrType === 'awg' && (
            <button
              onClick={handleDownloadConf}
              className="py-2.5 px-3 rounded-lg bg-cyber-cyan/20 hover:bg-cyber-cyan/30 border border-cyber-cyan/50 text-cyber-cyan font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-neon-cyan"
              title="Скачать .conf файл"
            >
              <Download className="w-4 h-4" />
              <span>.CONF</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
