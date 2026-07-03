import React from 'react';

// คอลเลกชันรูปประจำตัว (Avatar) เวกเตอร์ 2D ดีไซน์พรีเมียม (ผู้ชาย 5 รูป, ผู้หญิง 5 รูป)
export const AVATAR_LIST = [
  { id: 'm1', gender: 'male', name: 'หนุ่มฮิปสเตอร์ (Hipster Beanie)', color: '#FF7B00' },
  { id: 'm2', gender: 'male', name: 'เกมเมอร์สายชิล (Gamer Hoodie)', color: '#007BFF' },
  { id: 'm3', gender: 'male', name: 'หนุ่มเนิร์ดสุดสมาร์ท (Smart Glasses)', color: '#2EC4B6' },
  { id: 'm4', gender: 'male', name: 'ไซเบอร์พังค์บอย (Cyberpunk Green)', color: '#E0115F' },
  { id: 'm5', gender: 'male', name: 'หนุ่มสปอร์ตหมวกแคป (Sporty Cap)', color: '#70E000' },
  { id: 'w1', gender: 'female', name: 'สาวแว่นสุดอาร์ต (Artistic Bob)', color: '#FF007F' },
  { id: 'w2', gender: 'female', name: 'สตรีมเมอร์หูแมว (Gamer Neko)', color: '#7209B7' },
  { id: 'w3', gender: 'female', name: 'สาวเวิร์คกิ้งวูแมน (Smart Blazer)', color: '#4CC9F0' },
  { id: 'w4', gender: 'female', name: 'สาวพังค์ผมม่วง (Cyberpunk Violet)', color: '#F72585' },
  { id: 'w5', gender: 'female', name: 'สาวแก่นผมเปียคู่ (Space Buns)', color: '#FF4D6D' }
];

export function AvatarIcon({ id, size = 48, className = '' }) {
  const currentAvatar = AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0];

  // รันสร้างเวกเตอร์ SVG สำหรับแต่ละอวตารอย่างละเอียดและคมชัด
  const renderSvgContent = () => {
    switch (id) {
      // --- MALE AVATARS ---
      case 'm1': // Hipster Beanie
        return (
          <>
            <defs>
              <linearGradient id="g-m1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF9F1C" />
                <stop offset="100%" stopColor="#E71D36" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#g-m1)" />
            {/* Body */}
            <path d="M25,90 C25,75 35,70 50,70 C65,70 75,75 75,90 Z" fill="#333333" />
            <path d="M42,70 L58,70 L55,78 L45,78 Z" fill="#F4C2C2" /> {/* Neck */}
            {/* Face */}
            <circle cx="50" cy="52" r="18" fill="#FDD5B1" />
            {/* Beard */}
            <path d="M32,52 C32,68 40,75 50,75 C60,75 68,68 68,52 C68,52 64,56 50,56 C36,56 32,52 32,52 Z" fill="#4A3728" />
            <circle cx="50" cy="62" r="8" fill="#4A3728" />
            {/* Mustache */}
            <path d="M40,58 C45,56 48,58 50,60 C52,58 55,56 60,58 C55,60 52,60 50,62 C48,60 45,60 40,58 Z" fill="#2B1D0C" />
            {/* Eyes */}
            <circle cx="44" cy="48" r="2.5" fill="#333" />
            <circle cx="56" cy="48" r="2.5" fill="#333" />
            {/* Glasses */}
            <rect x="36" y="44" width="11" height="9" rx="2" fill="none" stroke="#000" strokeWidth="2" />
            <rect x="53" y="44" width="11" height="9" rx="2" fill="none" stroke="#000" strokeWidth="2" />
            <line x1="47" y1="48" x2="53" y2="48" stroke="#000" strokeWidth="2" />
            {/* Beanie (หมวกไหมพรม) */}
            <path d="M31,42 C31,25 40,20 50,20 C60,20 69,25 69,42 Z" fill="#2EC4B6" />
            <rect x="29" y="38" width="42" height="6" rx="2" fill="#011627" />
            <circle cx="50" cy="18" r="3.5" fill="#FFF" />
          </>
        );
      case 'm2': // Gamer Hoodie (หูฟัง + ฮู้ด)
        return (
          <>
            <defs>
              <linearGradient id="g-m2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E3C72" />
                <stop offset="100%" stopColor="#2A5298" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#g-m2)" />
            {/* Hoodie Body */}
            <path d="M22,90 C22,72 32,65 50,65 C68,65 78,72 78,90 Z" fill="#222" />
            <path d="M42,65 L58,65 L50,73 Z" fill="#E0A96D" /> {/* Neck */}
            {/* Face */}
            <circle cx="50" cy="48" r="16" fill="#FCD0A1" />
            {/* Messy Hair */}
            <path d="M34,44 C32,32 40,26 50,28 C60,26 68,32 66,44 C62,38 58,38 50,40 C42,38 38,38 34,44 Z" fill="#1B120C" />
            {/* Eyes */}
            <circle cx="45" cy="46" r="2.5" fill="#333" />
            <circle cx="55" cy="46" r="2.5" fill="#333" />
            {/* Mouth (Smile) */}
            <path d="M46,55 Q50,58 54,55" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" />
            {/* Hoodie Hood Lining */}
            <path d="M30,50 C30,30 38,25 50,25 C62,25 70,30 70,50 C70,68 62,70 50,70 C38,70 30,68 30,50 Z" fill="none" stroke="#444" strokeWidth="4" />
            {/* Headphones (หูฟังเกมเมอร์) */}
            <rect x="25" y="40" width="6" height="14" rx="2" fill="#E63946" />
            <rect x="69" y="40" width="6" height="14" rx="2" fill="#E63946" />
            <path d="M30,42 C30,22 40,18 50,18 C60,18 70,22 70,42" fill="none" stroke="#222" strokeWidth="4" />
          </>
        );
      case 'm3': // Smart Glasses (หนุ่มแว่นลุคคุณชาย)
        return (
          <>
            <defs>
              <linearGradient id="g-m3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#11998E" />
                <stop offset="100%" stopColor="#38EF7D" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#g-m3)" />
            {/* Suit & Tie */}
            <path d="M24,90 C24,76 34,70 50,70 C66,70 76,76 76,90 Z" fill="#1D3557" />
            <path d="M42,70 L58,70 L50,78 Z" fill="#FFF" /> {/* Shirt Collar */}
            <path d="M48,76 L52,76 L50,90 Z" fill="#E63946" /> {/* Tie */}
            <path d="M44,70 L56,70 L53,75 L47,75 Z" fill="#E0A96D" /> {/* Neck */}
            {/* Face */}
            <circle cx="50" cy="50" r="17" fill="#FCD0A1" />
            {/* Combed Hair */}
            <path d="M33,42 C33,26 44,22 50,22 C56,22 67,26 67,42 C67,42 62,34 50,34 C38,34 33,42 33,42 Z" fill="#2F1F17" />
            {/* Round Glasses */}
            <circle cx="43" cy="48" r="6" fill="none" stroke="#000" strokeWidth="2.5" />
            <circle cx="57" cy="48" r="6" fill="none" stroke="#000" strokeWidth="2.5" />
            <line x1="49" y1="48" x2="51" y2="48" stroke="#000" strokeWidth="2.5" />
            {/* Eyes */}
            <circle cx="43" cy="48" r="2.5" fill="#333" />
            <circle cx="57" cy="48" r="2.5" fill="#333" />
            {/* Smile */}
            <path d="M47,58 Q50,60 53,58" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'm4': // Cyberpunk Green (ผมสีนีออน + หน้ากากไซไฟ)
        return (
          <>
            <defs>
              <linearGradient id="g-m4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7F00FF" />
                <stop offset="100%" stopColor="#FF007F" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#g-m4)" />
            {/* Cyber Jacket */}
            <path d="M22,90 C22,74 32,68 50,68 C68,68 78,74 78,90 Z" fill="#1C1A27" />
            <path d="M43,68 L57,68 L50,75 Z" fill="#CBB2B2" /> {/* Neck */}
            {/* Face */}
            <circle cx="50" cy="48" r="17" fill="#ECCBBA" />
            {/* Cyber Mask (หน้ากากกึ่งไซไฟปิดปาก) */}
            <path d="M38,54 L62,54 L58,68 L42,68 Z" fill="#00FF66" opacity="0.85" />
            <line x1="50" y1="54" x2="50" y2="68" stroke="#000" strokeWidth="2" />
            {/* Spiky Neon Hair */}
            <path d="M31,44 L33,30 L40,34 L45,22 L51,32 L58,20 L62,34 L68,26 L68,44 C68,44 60,38 50,38 C40,38 31,44 31,44 Z" fill="#39FF14" />
            {/* Cyber Visor Eye (ตาเลเซอร์ข้างเดียว) */}
            <circle cx="44" cy="44" r="2.5" fill="#FFF" />
            <rect x="50" y="42" width="13" height="4" rx="2" fill="#00FFFF" />
            <circle cx="56" cy="44" r="2" fill="#FFF" />
          </>
        );
      case 'm5': // Sporty Cap (ใส่หมวกแก๊ปสไตล์สปอร์ต)
        return (
          <>
            <defs>
              <linearGradient id="g-m5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#11998E" />
                <stop offset="100%" stopColor="#38EF7D" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#g-m5)" />
            {/* Polo Shirt */}
            <path d="M22,90 C22,73 32,66 50,66 C68,66 78,73 78,90 Z" fill="#3D5A80" />
            <path d="M44,66 L56,66 L50,74 Z" fill="#FDD5B1" /> {/* Neck */}
            {/* Face */}
            <circle cx="50" cy="49" r="17" fill="#FDD5B1" />
            {/* Eyes */}
            <circle cx="44" cy="47" r="2" fill="#333" />
            <circle cx="56" cy="47" r="2" fill="#333" />
            {/* Smile */}
            <path d="M45,56 Q50,60 55,56" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" />
            {/* Cap (หมวกแก๊ปสีส้มเท่ๆ) */}
            <path d="M32,44 C32,28 42,24 50,24 C58,24 68,28 68,44 Z" fill="#F8961E" />
            <path d="M50,24 Q65,24 75,32 L68,42 Z" fill="#F8961E" /> {/* Cap Visor */}
            <rect x="30" y="40" width="40" height="5" rx="2.5" fill="#F3722C" />
          </>
        );

      // --- FEMALE AVATARS ---
      case 'w1': // Artistic Bob (สาวผมบ๊อบ + แว่นกลมใหญ่)
        return (
          <>
            <defs>
              <linearGradient id="g-w1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF007F" />
                <stop offset="100%" stopColor="#FF758F" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#g-w1)" />
            {/* Yellow Sweater */}
            <path d="M23,90 C23,75 33,68 50,68 C67,68 77,75 77,90 Z" fill="#FEE440" />
            <path d="M44,68 L56,68 L50,75 Z" fill="#ECCBBA" /> {/* Neck */}
            {/* Face */}
            <circle cx="50" cy="48" r="16" fill="#FEE3D0" />
            {/* Hair Bob (ผมบ๊อบสั้นสีน้ำตาลดำมีหน้าม้า) */}
            <path d="M31,48 C31,25 38,20 50,20 C62,20 69,25 69,48 C69,54 67,54 67,42 L33,42 C33,54 31,54 31,48 Z" fill="#1B120C" />
            <path d="M34,36 L66,36 L66,42 L34,42 Z" fill="#1B120C" /> {/* Bangs */}
            {/* Large Round Glasses */}
            <circle cx="43" cy="46" r="6.5" fill="none" stroke="#FF5400" strokeWidth="2" />
            <circle cx="57" cy="46" r="6.5" fill="none" stroke="#FF5400" strokeWidth="2" />
            <line x1="49" y1="46" x2="51" y2="46" stroke="#FF5400" strokeWidth="2" />
            {/* Eyes */}
            <circle cx="43" cy="46" r="2.5" fill="#333" />
            <circle cx="57" cy="46" r="2.5" fill="#333" />
            {/* Small red lips */}
            <path d="M48,56 Q50,58 52,56" fill="none" stroke="#E63946" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      case 'w2': // Gamer Neko (สาวเกมเมอร์หูแมวชมพู)
        return (
          <>
            <defs>
              <linearGradient id="g-w2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5E5C8A" />
                <stop offset="100%" stopColor="#9667E3" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#g-w2)" />
            {/* Black Off-Shoulder Top */}
            <path d="M22,90 C22,76 32,70 50,70 C68,70 78,76 78,90 Z" fill="#121212" />
            <path d="M43,70 L57,70 L50,76 Z" fill="#FDD5B1" /> {/* Neck */}
            {/* Face */}
            <circle cx="50" cy="48" r="16" fill="#FDD5B1" />
            {/* Long Hair (ผมยาวประบ่า) */}
            <path d="M32,40 C32,24 40,18 50,18 C60,18 68,24 68,40 C68,58 70,68 70,72 L30,72 C30,68 32,58 32,40 Z" fill="#DDA15E" />
            {/* Face bang overlays */}
            <path d="M36,32 L44,40 L50,34 L56,40 L64,32 L60,26 L40,26 Z" fill="#BC6C25" />
            {/* Eyes (Anime Style) */}
            <ellipse cx="44" cy="46" rx="2" ry="3" fill="#606C38" />
            <ellipse cx="56" cy="46" rx="2" ry="3" fill="#606C38" />
            {/* Cute Smile */}
            <path d="M47,54 Q50,56 53,54" fill="none" stroke="#E63946" strokeWidth="2" strokeLinecap="round" />
            {/* Pink Neko Headphones (หูฟังหูแมว) */}
            <rect x="27" y="40" width="5" height="12" rx="2.5" fill="#FF758F" />
            <rect x="68" y="40" width="5" height="12" rx="2.5" fill="#FF758F" />
            <path d="M30,42 C30,22 40,20 50,20 C60,20 70,42 70,42" fill="none" stroke="#FF758F" strokeWidth="3" />
            {/* Cat Ears on headband */}
            <polygon points="32,22 36,10 44,18" fill="#FF758F" />
            <polygon points="35,20 38,13 42,17" fill="#FFF" />
            <polygon points="68,22 64,10 56,18" fill="#FF758F" />
            <polygon points="65,20 62,13 58,17" fill="#FFF" />
          </>
        );
      case 'w3': // Smart Blazer (สาวทำงานลุคสมาร์ท)
        return (
          <>
            <defs>
              <linearGradient id="g-w3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A00E0" />
                <stop offset="100%" stopColor="#8E2DE2" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#g-w3)" />
            {/* Coral Blazer */}
            <path d="M23,90 C23,75 33,68 50,68 C67,68 77,75 77,90 Z" fill="#FF5E62" />
            <path d="M44,68 L56,68 L50,75 Z" fill="#EAE2B7" /> {/* Inner Shirt */}
            <path d="M45,72 L55,72 L50,82 Z" fill="#FFF" />
            {/* Face */}
            <circle cx="50" cy="46" r="16" fill="#FDD5B1" />
            {/* Neat Hair Bun (ผมรวบตึง) */}
            <circle cx="50" cy="24" r="7" fill="#1B120C" /> {/* Bun */}
            <path d="M33,40 C33,26 40,22 50,22 C60,22 67,40 67,40 Q60,34 50,34 Q40,34 33,40 Z" fill="#1B120C" />
            {/* Eyes */}
            <circle cx="44" cy="44" r="2.5" fill="#333" />
            <circle cx="56" cy="44" r="2.5" fill="#333" />
            {/* Red lips */}
            <path d="M46,54 Q50,57 54,54" fill="none" stroke="#D00000" strokeWidth="2.5" strokeLinecap="round" />
            {/* Small Gold Earrings */}
            <circle cx="33" cy="47" r="2.5" fill="#FFD700" />
            <circle cx="67" cy="47" r="2.5" fill="#FFD700" />
          </>
        );
      case 'w4': // Cyberpunk Violet (สาวไซเบอร์ผมม่วง)
        return (
          <>
            <defs>
              <linearGradient id="g-w4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F2027" />
                <stop offset="50%" stopColor="#203A43" />
                <stop offset="100%" stopColor="#2C5364" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#g-w4)" />
            {/* Techwear Jacket */}
            <path d="M22,90 C22,74 32,67 50,67 C68,67 78,74 78,90 Z" fill="#1C1B29" />
            <path d="M43,67 L57,67 L50,74 Z" fill="#ECCBBA" /> {/* Neck */}
            {/* Face */}
            <circle cx="50" cy="48" r="16" fill="#FDD5B1" />
            {/* Cyber Eyes & Makeup */}
            <rect x="38" y="44" width="24" height="3" rx="1.5" fill="#FF007F" />
            <circle cx="44" cy="45" r="2" fill="#00FFFF" />
            <circle cx="56" cy="45" r="2" fill="#00FFFF" />
            {/* Lips */}
            <path d="M47,56 Q50,58 53,56" fill="none" stroke="#FF007F" strokeWidth="2.5" strokeLinecap="round" />
            {/* Asymmetrical Neon Violet Hair (ผมม่วงปัดข้างสไตล์ไซไฟ) */}
            <path d="M31,44 L32,24 C36,18 44,16 52,18 C64,20 68,26 68,44 C68,46 65,42 60,36 L34,36 C32,40 31,44 31,44 Z" fill="#7209B7" />
            <path d="M31,44 C31,44 26,52 28,62 L32,48 Z" fill="#F72585" /> {/* Hanging Neon Streak */}
            {/* Cyber facial tattoo line */}
            <line x1="50" y1="36" x2="50" y2="44" stroke="#00FFFF" strokeWidth="1" />
          </>
        );
      case 'w5': // Space Buns (ผมดังโงะสองข้าง สีชมพูส้มสดใส)
        return (
          <>
            <defs>
              <linearGradient id="g-w5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FAD961" />
                <stop offset="100%" stopColor="#F76B1C" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#g-w5)" />
            {/* Denim Jacket */}
            <path d="M22,90 C22,75 32,68 50,68 C68,68 78,75 78,90 Z" fill="#457B9D" />
            <path d="M44,68 L56,68 L50,75 Z" fill="#FFF" /> {/* Tee */}
            <path d="M45,71 L55,71 L50,75 Z" fill="#FEE3D0" /> {/* Neck */}
            {/* Face */}
            <circle cx="50" cy="47" r="16" fill="#FEE3D0" />
            {/* Double Space Buns (ผมดังโงะคู่สีพาสเทล) */}
            <circle cx="34" cy="24" r="8" fill="#FF8FA3" />
            <circle cx="66" cy="24" r="8" fill="#FF8FA3" />
            {/* Base Hair overlay */}
            <path d="M32,40 C32,24 40,22 50,22 C60,22 68,24 68,40 C68,40 60,34 50,34 C40,34 32,40 32,40 Z" fill="#FFB3C1" />
            {/* Eyes */}
            <circle cx="44" cy="44" r="2.5" fill="#333" />
            <circle cx="56" cy="44" r="2.5" fill="#333" />
            {/* Cute open smile */}
            <path d="M46,52 Q50,56 54,52" fill="none" stroke="#E63946" strokeWidth="2.5" strokeLinecap="round" />
            {/* Choker necklace */}
            <rect x="44" y="65" width="12" height="2" fill="#000" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`avatar-svg-container ${className}`}
    >
      {renderSvgContent()}
    </svg>
  );
}
