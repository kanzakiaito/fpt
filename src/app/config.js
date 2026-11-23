/*
- ============================================
-  CONFIG - สุดยอดแฟนพันธุ์แห่งปี 2026
- ============================================
 *
-  แก้ไขข้อมูลด้านล่างเพื่อกำหนดคำถามและคำตอบ
-  สำหรับแต่ละหมวดของเกม
 *
 */

const GAME_CONFIG = {
    "threeSecondsHeaders": [
        "นี่คือภาพตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
        "นี่คือคุณสมบัติของตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
        "ประโยคต่อไปนี้เป็นของตัวละคร Harry Potter ที่มีชื่อว่าอะไร?"
    ],
    "threeSeconds": [
        {
            "question": "นี่คือภาพตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
            "image": "public/img/01.png",
            "audio": null,
            "video": null,
            "answer": "Hermione Granger"
        },
        {
            "question": "นี่คือภาพตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
            "image": "public/img/02.png",
            "audio": null,
            "video": null,
            "answer": "Luna Lovegood"
        },
        {
            "question": "นี่คือภาพตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
            "image": "public/img/03.png",
            "audio": null,
            "video": null,
            "answer": "Cho Chang"
        },
        {
            "question": "นี่คือภาพตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
            "image": "public/img/04.png",
            "audio": null,
            "video": null,
            "answer": "Nearly Headless Nick (นิกหัวเกือบขาด)"
        },
        {
            "question": "นี่คือภาพตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
            "image": "public/img/05.png",
            "audio": null,
            "video": null,
            "answer": "Newt Scamander"
        },
        {
            "question": "นี่คือภาพตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
            "image": "public/img/06.png",
            "audio": null,
            "video": null,
            "answer": "Vernon Dursley"
        },
        {
            "question": "นี่คือภาพตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
            "image": "public/img/07.png",
            "audio": null,
            "video": null,
            "answer": "Kingsley Shacklebolt"
        },
        {
            "question": "นี่คือภาพตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
            "image": "public/img/08.png",
            "audio": null,
            "video": null,
            "answer": "Antonin Dolohov"
        },
        {
            "question": "นี่คือภาพตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
            "image": "public/img/09.png",
            "audio": null,
            "video": null,
            "answer": "Nymphadora Tonks"
        },
        {
            "question": "นี่คือภาพตัวละคร Harry Potter ที่มีชื่อว่าอะไร?",
            "image": "public/img/10.png",
            "audio": null,
            "video": null,
            "answer": "Draco Malfoy"
        },
        {
            "question": "อาจารย์สอนวิชาป้องกันตัวจากศาสตร์มืดในภาคนักโทษแห่งอัซคาบัน",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Remus Lupin"
        },
        {
            "question": "ผู้สอนการเล่นควิดดิชให้แก่ Harry Potter",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Oliver Wood"
        },
        {
            "question": "แชมป์ร่วมกับ Harry Potter ในการแข่งขันไตรเวทประจำโรงเรียนฮอกวอร์ต",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Cedric Diggory"
        },
        {
            "question": "ผีประจำโรงเรียนฮอกวอร์ต",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Bloody Baron (บารอนเลือด)"
        },
        {
            "question": "พ่อเขยของ Ginny Weasley",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "James Potter"
        },
        {
            "question": "แมงมุมยักษ์พูดได้ของ Rubeus Hagrid",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Aragog"
        },
        {
            "question": "ครูใหญ่ประจำโรงเรียนเวทมนตร์โบซ์บาตง",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Olympe Maxime"
        },
        {
            "question": "อดีตมือปราบมารผู้มีศักดิ์เป็นพี่ชายของ Newt Scamander",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Theseus Scamander"
        },
        {
            "question": "ลูกชายอันเป็นญาติห่างของ Aberforth Dumbledore",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Credence Barebone / Aurelius Dumbledore"
        },
        {
            "question": "นักเรียนแห่งบ้านกริฟฟินดอร์ผู้มีสายฟ้าบนหน้าผาก",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Harry Potter"
        },
        {
            "question": "\"แฮร์รี่ พ่อของเจ้าเป็นคนยโส\"",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Severus Snape"
        },
        {
            "question": "\"ร้ายกาจ!\"",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Ron Weasley"
        },
        {
            "question": "\"ไม่มีใครขอความเห็นเธอ คนเลือดสีโคลนโสโครก\"",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Draco Malfoy"
        },
        {
            "question": "\"ทำไมเวลาเกิดอะไรขึ้น ต้องเป็นพวกเธอสามคนทุกที\"",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Minerva McGonagall"
        },
        {
            "question": "\"10 คะแนนให้บ้านกริฟฟินดอร์\"",
            "image": null,
            "audio": null,
            "video": null,
            "answer": "Albus Dumbledore"
        }
    ],
    "qa": {
        "question": "นับตั้งแต่ Harry Potter ภาคศิลาอาถรรพ์ ถึงภาคเครื่องรางยมทูต แฮรรี่ พอตเตอร์ทำแต้มให้บ้านกริฟฟินดอร์ได้ทั้งหมดกี่แต้ม เป็นแต้มบวกกี่แต้ม และถูกหักกี่แต้ม",
        "answer": "58 แต้ม / 350 แต้ม / 292 แต้ม",
        "audio": null,
        "choices": [
            "58 แต้ม / 208 แต้ม / 150 แต้ม",
            "58 แต้ม / 350 แต้ม / 292 แต้ม",
            "58 แต้ม / 420 แต้ม / 362 แต้ม",
            "96 แต้ม / 350 แต้ม / 294 แต้ม",
            "96 แต้ม / 500 แต้ม / 404 แต้ม"
        ],
        "eliminateMode": "order",
        "eliminateOrder": [
            3,
            4,
            5
        ]
    },
    "jigsaw": {
        "mode": "portrait",
        "image": "public/img/jigsaw.png",
        "answer": "Albus Dumbledore",
        "question": "หลังจิ๊กซอว์นี้คือตัวละคร Harry Potter ที่มีชื่อว่าอะไร?"
    },
    "attribute": {
        "question": "นี่คือคุณสมบัติของตัวละครใน Harry Potter ที่มีชื่อว่าอะไร",
        "clues": [
            "ปรากฏตัวครั้งแรกใน \"แฮร์รี่ พอตเตอร์กับศิลาอาถรรพ์\"",
            "1 ในผู้ถูกร่ายคำสาปโทษผิดสถานเดียวใส่",
            "หมวกคัดสรรคัดให้คน ๆ นี้อยู่บ้านกริฟฟินดอร์",
            "เป็นคนในตระกูลพอตเตอร์",
            "ปัจจุบันยังมีชีวิตอยู่"
        ],
        "answer": "Harry Potter (แฮรี่ พอตเตอร์)"
    },
    "battle": {
        "player1": {
            "threeSecMode": "5sets",
            "threeSecondsHeaders": [
                "เลขสายรถเมล์ต่อไปนี้มีต้นทาง-ปลายทางคือที่ใด?",
                "ต้นทาง-ปลายทางต่อไปนี้คือรถเมล์สายใด?",
                "นี่คือเลขสายปฏิรูปคือของรถเมล์สายใด?",
                "สายต่อไปนี้ ปัจจุบันใช้รถเมล์ยี่ห้ออะไรบ้าง? (ตอบให้ครบ)",
                "นี่คือภาพรถเมล์สายใด? (ภาพทั้งคัน ลบเลขสายออก)"
            ],
            "threeSeconds": [
                {
                    "question": "เลขสายรถเมล์ต่อไปนี้มีต้นทาง-ปลายทางคือที่ใด?",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "text": "59",
                    "answer": "รังสิต - สนามหลวง"
                },
                {
                    "question": "เลขสายรถเมล์ต่อไปนี้มีต้นทาง-ปลายทางคือที่ใด?",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "text": "137",
                    "answer": "(วงกลม) รัชดาภิเษก - รามคำแหง"
                },
                {
                    "question": "เลขสายรถเมล์ต่อไปนี้มีต้นทาง-ปลายทางคือที่ใด?",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "text": "1-80E",
                    "answer": "สวนสยาม - MRT สนามไชย (ทางด่วน)"
                },
                {
                    "question": "เลขสายรถเมล์ต่อไปนี้มีต้นทาง-ปลายทางคือที่ใด?",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "text": "3-55",
                    "answer": "ท่าเรือคลองเตย - สะพานพระราม 7"
                },
                {
                    "question": "เลขสายรถเมล์ต่อไปนี้มีต้นทาง-ปลายทางคือที่ใด?",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "text": "67",
                    "answer": "วัดเสมียนนารี - Central พระราม 3"
                },
                {
                    "question": "ม.ธรรมศาสตร์ รังสิต - อนุสาวรีย์ชัยสมรภูมิ",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "510"
                },
                {
                    "question": "The Mall ท่าพระ - คลองเตย",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "195 / 205 (เดิม)"
                },
                {
                    "question": "(วงกลม) อู่กัลปพฤกษ์ - พระราม 2",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "750 / 209"
                },
                {
                    "question": "เคหะธนบุรี - หมู่บ้านนักกีฬาแหลมทอง",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "171"
                },
                {
                    "question": "ปากเกร็ด - วงเวียนใหญ่ (ทางด่วน)",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "505"
                },
                {
                    "question": "1-11",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "95ก"
                },
                {
                    "question": "2-41",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "36ก"
                },
                {
                    "question": "1-77",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "26A"
                },
                {
                    "question": "4-44",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "80A"
                },
                {
                    "question": "3-21",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "207"
                },
                {
                    "question": "47",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "HINO"
                },
                {
                    "question": "137",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "MITSUBISHI / DAEWOO"
                },
                {
                    "question": "113",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "NEX-Minebus"
                },
                {
                    "question": "26",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "MITSUBISHI / HINO / BONLUCK"
                },
                {
                    "question": "141",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "BONLUCK"
                },
                {
                    "question": "นี่คือภาพรถเมล์สายใด? (ภาพทั้งคัน ลบเลขสายออก)",
                    "image": "public/img/P1/21.png",
                    "audio": null,
                    "video": null,
                    "answer": "180"
                },
                {
                    "question": "นี่คือภาพรถเมล์สายใด? (ภาพทั้งคัน ลบเลขสายออก)",
                    "image": "public/img/P1/22.png",
                    "audio": null,
                    "video": null,
                    "answer": "13"
                },
                {
                    "question": "นี่คือภาพรถเมล์สายใด? (ภาพทั้งคัน ลบเลขสายออก)",
                    "image": "public/img/P1/23.png",
                    "audio": null,
                    "video": null,
                    "answer": "4-70E"
                },
                {
                    "question": "นี่คือภาพรถเมล์สายใด? (ภาพทั้งคัน ลบเลขสายออก)",
                    "image": "public/img/P1/24.png",
                    "audio": null,
                    "video": null,
                    "answer": "3-31"
                },
                {
                    "question": "นี่คือภาพรถเมล์สายใด? (ภาพทั้งคัน ลบเลขสายออก)",
                    "image": "public/img/P1/25.png",
                    "audio": null,
                    "video": null,
                    "answer": "96 (1-42)"
                }
            ],
            "qa": {
                "question": "การปรับการนับวันบัตรโดยสารล่วงหน้าอิเล็กทรอนิกส์จากที่เริ่มนับวันที่ 1 เป็นเริ่มนับจากวันที่ใช้งานจริง เริ่มใช้ครั้งแรกใน วัน/เดือน/ปี ใด",
                "answer": "8 มีนาคม พ.ศ. 2568",
                "choices": [
                    "1 ตุลาคม พ.ศ. 2562",
                    "5 ธันวาคม พ.ศ. 2565",
                    "1 มกราคม พ.ศ. 2568",
                    "8 มีนาคม พ.ศ. 2568",
                    "ไม่เคยปรับ"
                ],
                "eliminateMode": "random",
                "eliminateOrder": [
                    1,
                    2,
                    3,
                    5
                ]
            },
            "jigsaw": {
                "mode": "square",
                "image": "public/img/P1/jigsaw.png",
                "answer": "สาย 511",
                "question": "หลังจิ๊กซอว์นี้คือรถเมล์สายใด?"
            },
            "attribute": {
                "question": "นี่คือคุณสมบัติของรถเมล์สายใด",
                "clues": [
                    "เลขสายเดิมมี 2 หลัก เลขสายปฏิรูปขึ้นต้นด้วยเลข 1",
                    "อยู่ในเขตการเดินรถที่ 2",
                    "เส้นทางวิ่งจอดสามย่านมิตรทาวน์",
                    "เส้นทางวิ่งผ่านสถานีรถไฟฟ้าสายสีเหลือง",
                    "เส้นทางวิ่งไม่ผ่านอนุสาวรีย์ชัยสมรภูมิ"
                ],
                "answer": "สาย 93"
            }
        },
        "player2": {
            "threeSecMode": "2sets",
            "threeSecondsHeaders": [
                "นี่คือตัวละครที่มีชื่อว่าอะไร",
                "ตัวละครที่กำลังจะได้ยินต่อไปนี้ ปรากฎตัวครั้งแรกใน Spider-Man ภาคใด"
            ],
            "threeSeconds": [
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/01.png",
                    "audio": null,
                    "video": null,
                    "answer": "Peter Parker"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/02.png",
                    "audio": null,
                    "video": null,
                    "answer": "Miles Morales"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/03.png",
                    "audio": null,
                    "video": null,
                    "answer": "Green Goblin (Norman Osborn)"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/04.png",
                    "audio": null,
                    "video": null,
                    "answer": "Doctor Octopus (Otto Octavius)"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/05.png",
                    "audio": null,
                    "video": null,
                    "answer": "Gwen Stacy (Spider-Gwen / Ghost-Spider)"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/06.png",
                    "audio": null,
                    "video": null,
                    "answer": "Venom (Eddie Brock)"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/07.png",
                    "audio": null,
                    "video": null,
                    "answer": "Miguel O'Hara (Spiderman 2099)"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/08.png",
                    "audio": null,
                    "video": null,
                    "answer": "Kingpin (Wilson Fisk)"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/09.png",
                    "audio": null,
                    "video": null,
                    "answer": "Black Cat (Felicia Hardy)"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/10.png",
                    "audio": null,
                    "video": null,
                    "answer": "Ben Reilly (Scarlet Spider)"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/11.png",
                    "audio": null,
                    "video": null,
                    "answer": "Kraven the Hunter (Sergei Kravinoff)"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/12.png",
                    "audio": null,
                    "video": null,
                    "answer": "Ezekiel Sims"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/13.png",
                    "audio": null,
                    "video": null,
                    "answer": "Mary Jane Watson"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/14.png",
                    "audio": null,
                    "video": null,
                    "answer": "Spider-Ham (Peter Porker)"
                },
                {
                    "question": "นี่คือตัวละครที่มีชื่อว่าอะไร",
                    "image": "public/img/P2/15.png",
                    "audio": null,
                    "video": null,
                    "answer": "Michelle Jones-Watson"
                },
                {
                    "question": "Harry Osborn (New Goblin)",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "Spider-Man"
                },
                {
                    "question": "Dr. Curt Connors (The Lizard)",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "Spider-Man 2"
                },
                {
                    "question": "Elizabeth \"Liz\" Allan",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "Spider-Man: Homecoming"
                },
                {
                    "question": "Bonesaw McGraw",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "Spider-Man"
                },
                {
                    "question": "Mr. Ditkovich",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "Spider-Man 2"
                },
                {
                    "question": "Flash Thompson",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "Spider-Man: Homecoming"
                },
                {
                    "question": "Phineas Mason (The Tinkerer)",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "Spider-Man: Homecoming"
                },
                {
                    "question": "Spider-Man Noir",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "Spider-Man: Into the Spider-Verse"
                },
                {
                    "question": "Captain George Stacy",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "Spider-Man 3"
                },
                {
                    "question": "Ned Leeds",
                    "image": null,
                    "audio": null,
                    "video": null,
                    "answer": "Spider-Man: Homecoming"
                }
            ],
            "qa": {
                "question": "Spider-Man ฉบับทีวีซีรีส์ญี่ปุ่น ออกฉายครั้งแรกในปี ค.ศ. ใด / ผลิตโดยบริษัทอะไร / ร่างคนของ Spider-Man ฉบับทีวีซีรีส์ญี่ปุ่นมีชื่อว่าอะไร / นำแสดงโดยใคร?",
                "answer": "1978 / Toei / Yamashiro Takuya / Todou Shinji",
                "choices": [
                    "1975 / Toho / Mamiya Juuzou / Nakaya Noboru",
                    "1976 / Toho / Yamashiro Takuya / Todou Shinji",
                    "1977 / Toei / Yamashiro Takuya / Todou Shinji",
                    "1978 / Toei / Yamashiro Takuya / Todou Shinji",
                    "1979 / Toei / Mamiya Juuzou / Nakaya Noboru"
                ],
                "eliminateMode": "random",
                "eliminateOrder": [
                    1,
                    2,
                    3,
                    5
                ]
            },
            "jigsaw": {
                "mode": "square",
                "image": "public/img/P2/jigsaw.png",
                "answer": "Spider-Man: No Way Home",
                "question": "หลังจิ๊กซอว์นี้ นี่คือภาพจากภาพยนตร์หรือแอนิเมชั่น Spider-Man ภาคใด"
            },
            "attribute": {
                "question": "นี่คือคุณสมบัติของตัวละครจักรวาล Spider-Man ที่มีชื่อว่าอะไร?",
                "clues": [
                    "ร่างมนุษย์ปกติมีผมสีดำ",
                    "แปลงร่างไม่ได้",
                    "ไม่ได้มาจาก Earth-616",
                    "เพศหญิง แต่ไม่ใช่ตัวร้าย",
                    "1 ในสมาชิกไอ้แมงมุมใน Spider-Man: Into the Spider-Verse"
                ],
                "answer": "Peni Parker"
            }
        }
    }
};

export default GAME_CONFIG;