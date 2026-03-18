import { QRCodeSVG } from 'qrcode.react';

export default function QRCode({ url, size = 200 }) {
  return (
    <div className="bg-white p-3 rounded-2xl inline-block shadow-lg shadow-black/20">
      <QRCodeSVG value={url} size={size} />
    </div>
  );
}
