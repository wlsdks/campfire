import { getStorage } from 'firebase/storage';
import { app } from './firebase';

// 별도 모듈 — main bundle 분리용. 학생 vote 흐름엔 storage 미사용이라
// SubmitPage / AdminPage(라이브 심사) 청크에서만 다운로드.
export const storage = getStorage(app);
