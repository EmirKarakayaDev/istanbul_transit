import type { IlceMahallePoint } from '../../utils/loadIlceMahalle';

interface ExportDistrict {
  name: string;
  population: number;
  lat: number;
  lon: number;
  neighborhoods: Array<{ name: string; population: number; lat: number; lon: number }>;
}

/**
 * Düz nokta listesini orijinal JSON formatına (districts + neighborhoods) çevirir.
 */
export function buildExportData(points: IlceMahallePoint[]): { districts: ExportDistrict[] } {
  const districtMap = new Map<string, ExportDistrict>();

  for (const p of points) {
    if (p.type === 'ilce') {
      districtMap.set(p.name, {
        name: p.name,
        population: p.population,
        lat: p.coordinates[1],
        lon: p.coordinates[0],
        neighborhoods: [],
      });
    }
  }

  for (const p of points) {
    if (p.type === 'mahalle' && p.districtName) {
      const district = districtMap.get(p.districtName);
      if (district) {
        district.neighborhoods.push({
          name: p.name,
          population: p.population,
          lat: p.coordinates[1],
          lon: p.coordinates[0],
        });
      }
    }
  }

  return {
    districts: Array.from(districtMap.values()),
  };
}

/**
 * Düzeltilmiş veriyi JSON dosyası olarak indirir.
 */
export function downloadIlceMahalleJson(points: IlceMahallePoint[]): void {
  const data = buildExportData(points);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `istanbul_ilce_mahalle_nufus_koordinat_duzeltilmis_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
