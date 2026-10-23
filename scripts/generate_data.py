"""Gera referências fictícias e clima diário sintético, sem dependências externas.

Seed e intervalo fixos: a saída deve ser idêntica em todas as execuções.
Não utiliza CAR, perímetros, ativos ou informação de empresas reais.
"""
import json
import math
import random
from datetime import date, timedelta
from pathlib import Path

SEED = 42
START = date(2025, 9, 1)
END = date(2026, 8, 31)
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "dataset.json"


def generate():
    rng = random.Random(SEED)
    farms = []
    fields = []
    weather = []
    names = [("aurora", "Fazenda Aurora", "Vale do Sol", 0),
             ("horizonte", "Fazenda Horizonte", "Serra Clara", 1),
             ("veredas", "Fazenda Veredas", "Campo Sereno", 2)]
    for farm_id, name, region, index in names:
        farms.append({"id": farm_id, "name": name, "region": region,
                      "warehouseId": f"ARM-0{index+1}", "capacity": 16000 + index * 2000,
                      "openingStock": [7600, 15000, 8600][index], "silos": 4,
                      "machineIds": [f"TR-0{index+1}", f"CL-0{index+1}", f"PV-0{index+1}"]})
        for j in range(8):
            crop = ["Soja", "Soja", "Algodão", "Milho", "Soja", "Algodão", "Milho", "Soja"][j]
            sow = {"Soja": date(2025, 10, 8), "Milho": date(2026, 2, 4),
                   "Algodão": date(2025, 12, 12)}[crop] + timedelta(days=j * 2 + index * 3)
            duration = {"Soja": 119, "Milho": 134, "Algodão": 185}[crop]
            fields.append({"id": f"{farm_id}-{j+1:02}", "farmId": farm_id,
                           "name": f"Talhão {j+1:02}", "crop": crop,
                           "area": rng.randrange(115, 235), "plantDate": sow.isoformat(),
                           "harvestDate": (sow + timedelta(days=duration)).isoformat(),
                           "yieldTonHa": round({"Soja": 3.8, "Milho": 6.5, "Algodão": 4.6}[crop] + rng.uniform(-.4, .5), 2),
                           "plantDuration": 7 + j % 3, "harvestDuration": 14 + j * 2,
                           "inWindow": not (index == 0 and j == 7), "soilPh": round(rng.uniform(5.4, 6.5), 1),
                           "clay": rng.randrange(28, 55), "organicMatter": round(rng.uniform(2.4, 4.0), 1),
                           "position": [(-30 if j % 2 == 0 else 15) + index * 2, -43 + (j // 2) * 27],
                           "size": [39 + rng.randrange(0, 5), 21 + rng.randrange(0, 3)]})
        current = START
        while current <= END:
            day = (current - START).days
            rainy = current.month in [10, 11, 12, 1, 2, 3, 4]
            weather.append({"farmId": farm_id, "date": current.isoformat(),
                            "temperature": round(26 + 3 * math.sin(day / 32) + rng.uniform(-2, 2), 1),
                            "rain": round(rng.uniform(2, 24) if rng.random() < (.47 if rainy else .09) else 0, 1),
                            "humidity": rng.randrange(58, 88) if rainy else rng.randrange(32, 65),
                            "wind": round(rng.uniform(2, 17), 1)})
            current += timedelta(days=1)
    return {"schemaVersion": 1, "seed": SEED, "simulated": True,
            "season": "2025/26", "startDate": START.isoformat(), "endDate": END.isoformat(),
            "defaultDate": "2026-03-12", "farms": farms, "fields": fields, "weather": weather}


if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(generate(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Dados fictícios gerados (seed={SEED}): {OUT.name}")
