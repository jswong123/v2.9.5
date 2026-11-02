#!/usr/bin/env python3
"""联网运行：下载1955年12种勋略的原始SVG文件到游戏本地。
用法：在游戏根目录运行 python scripts/download_honor_ribbons.py
不修改SVG纹样；对下载内容做基础SVG检查；失败项目不会伪造图片。
"""
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import time, json
FILES={
 'CN-001':'Order of Bayi 1st Class.svg',
 'CN-002':'Order of Bayi 2nd Class.svg',
 'CN-003':'Order of Bayi 3rd Class.svg',
 'CN-004':'Medal of Bayi Ribbon.svg',
 'CN-005':'Order of Independence and Freedom 1st Class.svg',
 'CN-006':'Order of Independence and Freedom 2nd Class.svg',
 'CN-007':'Order of Independence and Freedom 3rd Class.svg',
 'CN-008':'Medal of Independence and Freedom Ribbon.svg',
 'CN-009':'Order of Liberation 1st Class.svg',
 'CN-010':'Order of Liberation 2nd Class.svg',
 'CN-011':'Order of Liberation 3rd Class.svg',
 'CN-012':'Medal of Liberation Ribbon.svg',
}
root=Path(__file__).resolve().parents[1]
out=root/'src/achievements/assets/ribbons/china'
out.mkdir(parents=True,exist_ok=True)
report={}
for id,name in FILES.items():
 url='https://commons.wikimedia.org/wiki/Special:FilePath/'+quote(name)
 try:
  req=Request(url,headers={'User-Agent':'FrontlineHistoricalRibbonArchiver/1.0 (educational offline archival; Python urllib)'})
  with urlopen(req,timeout=25) as r:
   data=r.read(3_000_000)
   final=r.geturl()
  head=data[:1000].lower()
  if b'<svg' not in head and b'<svg' not in data[:3000].lower():
   raise ValueError('下载内容不是SVG，可能源文件名不存在或站点拒绝访问')
  (out/(id+'.svg')).write_bytes(data)
  report[id]={'status':'downloaded','source':url,'resolved_url':final,'filename':id+'.svg','bytes':len(data),'license':'请逐项查看Commons文件页面'}
  print('成功',id,name)
 except Exception as e:
  report[id]={'status':'failed','source':url,'error':str(e)}
  print('失败',id,str(e))
 time.sleep(.3)
(out/'DOWNLOAD-REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('完成：',sum(x['status']=='downloaded' for x in report.values()),'/',len(report))
print('结果：',out/'DOWNLOAD-REPORT.json')
