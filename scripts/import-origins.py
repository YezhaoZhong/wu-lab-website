"""Extract only aggregated, non-identifying hometown locations from the local workbook."""
import json
import io
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

source = Path(sys.argv[1] if len(sys.argv) > 1 else "../20260920_课题组学生信息收集/成员名单及信息汇总.xlsx")
root = Path(__file__).resolve().parents[1]
ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
if source.suffix == ".zip":
    with zipfile.ZipFile(source) as outer:
        workbook = next(name for name in outer.namelist() if name.endswith(".xlsx"))
        workbook_source = io.BytesIO(outer.read(workbook))
else:
    workbook_source = source
with zipfile.ZipFile(workbook_source) as archive:
    strings = (["".join(node.itertext()) for node in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
               if "xl/sharedStrings.xml" in archive.namelist() else [])
    rows = ET.fromstring(archive.read("xl/worksheets/sheet1.xml")).findall(".//m:row", ns)
    def value(cell):
        raw = cell.findtext("m:v", "", ns)
        if cell.get("t") == "s":
            return strings[int(raw)]
        if cell.get("t") == "inlineStr":
            return "".join(cell.find("m:is", ns).itertext())
        return raw
    column = next(("".join(filter(str.isalpha, c.get("r"))) for c in rows[0]
                   if value(c).strip() == "籍贯/省份"), None)
    if column is None:
        raise ValueError("Missing 籍贯/省份 column")
    locations = sorted({value(c).strip() for row in rows[1:] for c in row
                        if "".join(filter(str.isalpha, c.get("r"))) == column and value(c).strip()})
province_ids = {
    "陕西": "CNSN", "上海": "CNSH", "重庆": "CNCQ", "浙江": "CNZJ", "江西": "CNJX",
    "云南": "CNYN", "山东": "CNSD", "辽宁": "CNLN", "西藏": "CNXZ", "甘肃": "CNGS",
    "香港": "CNHK", "青海": "CNQH", "北京": "CNBJ", "澳门": "CNMO", "内蒙古": "CNNM",
    "湖北": "CNHB", "安徽": "CNAH", "贵州": "CNGZ", "宁夏": "CNNX", "江苏": "CNJS",
    "新疆": "CNXJ", "山西": "CNSX", "湖南": "CNHN", "四川": "CNSC", "广西": "CNGX",
    "吉林": "CNJL", "台湾": "CNTW", "河北": "CNHE", "天津": "CNTJ", "广东": "CNGD",
    "福建": "CNFJ", "黑龙江": "CNHL", "河南": "CNHA", "海南": "CNHI"
}
svg_ns = {"s": "http://www.w3.org/2000/svg"}
svg = ET.parse(root / "assets/people/china.svg")
centers = {c.get("id"): c for c in svg.findall(".//s:g[@id='label_points']/s:circle", svg_ns)}
provinces = sorted({prefix for location in locations for prefix in province_ids if location.startswith(prefix)})
unknown = [location for location in locations if not any(location.startswith(p) for p in province_ids)]
if unknown:
    raise ValueError(f"Review unrecognized hometown locations: {unknown}")
aggregates = []
for province in provinces:
    point = centers[province_ids[province]]
    aggregates.append({"id": province_ids[province], "zh": province,
                       "en": point.get("class").replace(" Province", "").replace(" Municipality", ""),
                       "x": float(point.get("cx")), "y": float(point.get("cy"))})
payload = {"source": source.name, "field": "籍贯/省份", "locations": aggregates,
           "note": "Only aggregated location names; no member identities or counts."}
(root / "data/origins.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
(root / "assets/people/origins.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
print(f"Imported {len(provinces)} province-level locations. No personal roster data exported.")
