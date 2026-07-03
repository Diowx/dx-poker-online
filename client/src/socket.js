import { io } from 'socket.io-client';

// ในโหมด Development หลังบ้านจะรันอยู่ที่พอร์ต 3001
// ในโหมด Production จะต่อตรงกับโฮสต์เดียวกันที่เสิร์ฟหน้าเว็บ
const URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

export const socket = io(URL, {
  autoConnect: false
});
