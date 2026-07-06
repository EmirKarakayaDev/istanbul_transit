export interface IlceMahallePoint {
  id: string;
  name: string;
  type: 'ilce' | 'mahalle';
  population: number;
  coordinates: [number, number]; // [lon, lat]
  districtName?: string; // mahalle ise hangi ilçeye ait
}

interface RawDistrict {
  name: string;
  population: number;
  lat: number;
  lon: number;
  neighborhoods: Array<{ name: string; population: number; lat: number; lon: number }>;
}

interface RawData {
  districts: RawDistrict[];
}

let cached: IlceMahallePoint[] | null = null;

/**
 * İstanbul ilçe ve mahalle nüfus/koordinat verisini yükle, düz liste olarak döndür.
 */
export async function loadIlceMahalle(): Promise<IlceMahallePoint[]> {
  if (cached) return cached;

  const res = await fetch('/data/istanbul_ilce_mahalle_nufus_koordinat.json');
  if (!res.ok) throw new Error(`İlçe/mahalle verisi yüklenemedi: ${res.status}`);

  const data = (await res.json()) as RawData;
  const out: IlceMahallePoint[] = [];

  for (const district of data.districts) {
    out.push({
      id: `ilce_${district.name.replace(/\s+/g, '_')}`,
      name: district.name,
      type: 'ilce',
      population: district.population,
      coordinates: [district.lon, district.lat],
    });

    for (const nb of district.neighborhoods) {
      out.push({
        id: `mahalle_${district.name}_${nb.name}`.replace(/\s+/g, '_'),
        name: nb.name,
        type: 'mahalle',
        population: nb.population,
        coordinates: [nb.lon, nb.lat],
        districtName: district.name,
      });
    }
  }

  cached = out;
  return out;
}
