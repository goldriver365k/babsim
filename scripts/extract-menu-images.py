"""
키오스크 사진 6장에서 음식 이미지를 추출하는 일회성 스크립트.
홈페이지 실행에는 필요하지 않으며, 참고/재작업용으로만 보관한다.

사용법: python3 extract-menu-images.py
(원본 사진은 images/kiosk-reference/ 안의 01~06 파일을 사용)
"""
from PIL import Image
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(BASE, "images", "kiosk-reference")

def crop(src, box, dest):
    im = Image.open(os.path.join(REF, src))
    out = im.crop(box).convert("RGB")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    out.save(dest, quality=90)
    print("saved", dest)

# ---------- 밥심 1층 (01-bapsim.png) ----------
B = "01-bapsim.png"
crop(B, (295,210,486,336), os.path.join(BASE,"images/bapsim/breakfast-buffet-icon.jpg"))
crop(B, (530,210,721,336), os.path.join(BASE,"images/bapsim/lunch-buffet-icon.jpg"))
crop(B, (765,210,956,336), os.path.join(BASE,"images/bapsim/lunch-buffet-ramen-icon.jpg"))
crop(B, (295,555,480,725), os.path.join(BASE,"images/bapsim/self-ramen.jpg"))
crop(B, (525,555,725,725), os.path.join(BASE,"images/bapsim/fried-eggs.jpg"))
crop(B, (90,900,215,1065), os.path.join(BASE,"images/bapsim/cola.jpg"))
crop(B, (335,900,460,1065), os.path.join(BASE,"images/bapsim/zero-cola.jpg"))
crop(B, (580,900,705,1065), os.path.join(BASE,"images/bapsim/fanta-pine.jpg"))
crop(B, (820,900,945,1065), os.path.join(BASE,"images/bapsim/sprite.jpg"))

# ---------- 만권화밥 1층 화면1 (02-mangwon-page-1.png) ----------
M1 = "02-mangwon-page-1.png"
cols = [(20,250),(270,500),(515,745),(760,990)]
row1 = (220,415); row2=(615,785); row3=(1000,1165)
m1_row1 = ["mul-naengmyeon","mul-naengmyeon-bulgogi","bibim-naengmyeon","bibim-naengmyeon-bulgogi"]
m1_row2 = ["seafood-sundubu","usamgyeop-sundubu","jikhwa-beef-deopbap","dwaeji-bulbaek"]
m1_row3 = ["bulhyang-jikhwa-beef-kimchi-deopbap","bulhyang-jikhwa-pork-kimchi-deopbap","dwaeji-kimchi-jjigae","spam-dwaeji-kimchi-jjigae"]
for name,(l,r) in zip(m1_row1, cols):
    crop(M1, (l,row1[0],r,row1[1]), os.path.join(BASE,f"images/mangwon/{name}.jpg"))
for name,(l,r) in zip(m1_row2, cols):
    crop(M1, (l,row2[0],r,row2[1]), os.path.join(BASE,f"images/mangwon/{name}.jpg"))
for name,(l,r) in zip(m1_row3, cols):
    crop(M1, (l,row3[0],r,row3[1]), os.path.join(BASE,f"images/mangwon/{name}.jpg"))

# ---------- 만권화밥 1층 화면2 (03-mangwon-page-2.png) ----------
M2 = "03-mangwon-page-2.png"
row1b = (220,415); row2b=(615,785); row3b=(940,1135)
m2_row1 = ["spam-sundubu","jikhwa-beef-jjigae-set","dwaeji-bulbaek-jjigae-set","garlic-soy-chicken-deopbap"]
m2_row2 = ["bulhyang-gochujang-chicken-deopbap","garlic-soy-chicken-deopbap-jjigae-set","bulhyang-gochujang-chicken-deopbap-jjigae-set","flying-fish-roe-bap"]
m2_row3 = ["spam-flying-fish-roe-bap","dukkeobi-yukgaejang","dukkeobi-udon-yukgaejang","jikhwa-samgyeop-deopbap"]
for name,(l,r) in zip(m2_row1, cols):
    crop(M2, (l,row1b[0],r,row1b[1]), os.path.join(BASE,f"images/mangwon/{name}.jpg"))
for name,(l,r) in zip(m2_row2, cols):
    crop(M2, (l,row2b[0],r,row2b[1]), os.path.join(BASE,f"images/mangwon/{name}.jpg"))
for name,(l,r) in zip(m2_row3, cols):
    crop(M2, (l,row3b[0],r,row3b[1]), os.path.join(BASE,f"images/mangwon/{name}.jpg"))

# ---------- 후루룩찹찹 2층 화면1 (04-hururuk-page-1.png) ----------
H1 = "04-hururuk-page-1.png"
hcols = [(15,255),(265,495),(505,735),(745,975)]
hrow1 = (315,530); hrow2=(690,890); hrow3=(1035,1220)
h1_row1 = ["usamgyeop-malatang-samgak-kimbap-set","usamgyeop-bomb-riceNoodle-samgak-kimbap-set","bulhyang-usamgyeop-ragu-pasta-samgak-kimbap-set","usamgyeop-malatang"]
h1_row2 = ["usamgyeop-bomb-rice-noodle","bulhyang-usamgyeop-ragu-deopbap","pork-malatang","king-chicken-rice-noodles"]
h1_row3 = ["duthum-chashu-rice-noodle","bulhyang-ganjang-usamgyeop-bokkeummyeon","hwakkeun-gochujang-usamgyeop-bokkeummyeon","meat-ragu-spaghetti"]
for name,(l,r) in zip(h1_row1, hcols):
    crop(H1, (l,hrow1[0],r,hrow1[1]), os.path.join(BASE,f"images/hururuk/{name}.jpg"))
for name,(l,r) in zip(h1_row2, hcols):
    crop(H1, (l,hrow2[0],r,hrow2[1]), os.path.join(BASE,f"images/hururuk/{name}.jpg"))
for name,(l,r) in zip(h1_row3, hcols):
    crop(H1, (l,hrow3[0],r,hrow3[1]), os.path.join(BASE,f"images/hururuk/{name}.jpg"))

# ---------- 후루룩찹찹 2층 화면2 (05-hururuk-page-2.png) ----------
H2 = "05-hururuk-page-2.png"
hrow1b = (330,490); hrow2b=(635,800); hrow3b=(955,1120)
h2_row1 = ["meat-ragu-deopbap","sausage-ragu-deopbap","bulhyang-usamgyeop-ragu-spaghetti","sausage-ragu-spaghetti"]
h2_row2 = ["duthum-chashu-ragu-spaghetti","clam-chowder-spaghetti","eolkeun-usamgyeop-haejang-pasta","bulhyang-usamgyeop-kimchi-cream-pasta"]
h2_row3 = ["bulhyang-kimchi-bulgogi-deopbap","garlic-pork-deopbap","duthum-chashu-deopbap","tomato-pork-curry"]
for name,(l,r) in zip(h2_row1, hcols):
    crop(H2, (l,hrow1b[0],r,hrow1b[1]), os.path.join(BASE,f"images/hururuk/{name}.jpg"))
for name,(l,r) in zip(h2_row2, hcols):
    crop(H2, (l,hrow2b[0],r,hrow2b[1]), os.path.join(BASE,f"images/hururuk/{name}.jpg"))
for name,(l,r) in zip(h2_row3, hcols):
    crop(H2, (l,hrow3b[0],r,hrow3b[1]), os.path.join(BASE,f"images/hururuk/{name}.jpg"))

# ---------- 후루룩찹찹 2층 화면3 (06-hururuk-page-3.png) ----------
H3 = "06-hururuk-page-3.png"
crop(H3, (20,340,235,535), os.path.join(BASE,"images/hururuk/italian-crispy-pork-cheese-deopbap.jpg"))
crop(H3, (500,335,680,530), os.path.join(BASE,"images/hururuk/cola.jpg"))
crop(H3, (730,335,905,530), os.path.join(BASE,"images/hururuk/zero-cola.jpg"))
crop(H3, (65,630,205,800), os.path.join(BASE,"images/hururuk/fanta.jpg"))

print("모든 크롭 완료")
