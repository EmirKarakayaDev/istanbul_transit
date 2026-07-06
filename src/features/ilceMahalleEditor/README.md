# İlçe/Mahalle düzenleme modu

Bu klasör, ilçe/mahalle noktalarını haritada **sürükleyerek düzeltme** ve **düzeltilmiş JSON indirme** özelliklerini içerir. Şu an ana uygulamada kullanılmıyor; veriler düzeltildiği için sadece salt-okunur katman gösteriliyor.

## İçerik

- **store.ts** — `useIlceMahalleEditorStore`: points, setPoints, updatePointCoordinates
- **exportIlceMahalle.ts** — buildExportData, downloadIlceMahalleJson
- **IlceMahalleLayerEditor.tsx** — Sürükleme + tooltip (“Sürükleyerek konumu düzelt”) ile tam katman bileşeni

## Düzenleme modunu tekrar açmak

1. **Katman:** `App.tsx` (veya harita bileşenin) içinde `IlceMahalleLayer` yerine `IlceMahalleLayerEditor` import edip kullan.
2. **Panel:** `LayerPanel.tsx` içinde:
   - `useIlceMahalleEditorStore` import et, `points` al
   - İlçe/Mahalle toggle’ı açıkken “📥 Düzeltilmiş JSON indir” butonunu göster; `onClick` içinde `downloadIlceMahalleJson(points)` çağır.

Not: Editor katmanı farklı source/layer id kullanır (`ilce-mahalle-editor-source`, `ilce-mahalle-editor-layer`), böylece normal katmanla aynı anda eklenmez; birini kullan.
