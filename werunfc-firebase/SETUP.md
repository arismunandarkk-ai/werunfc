# We Run FC — Setup Guide

## Step 1: Buat Project Firebase (5 menit)

1. Buka https://console.firebase.google.com/
2. Klik "Add project" / "Tambah project"
3. Beri nama: **werunfc** → klik Continue
4. Matikan Google Analytics (tidak perlu) → klik Create Project
5. Tunggu sampai selesai → klik Continue

### Aktifkan Realtime Database
1. Di sidebar kiri, klik **Build** → **Realtime Database**
2. Klik **Create Database**
3. Pilih lokasi: **Singapore (asia-southeast1)**
4. Pilih **Start in test mode** → klik Enable
5. Database sudah aktif!

### Dapatkan Config
1. Di sidebar kiri, klik ikon ⚙️ (gear) → **Project settings**
2. Scroll ke bawah, klik **</>** (Web) untuk menambah web app
3. Beri nama: **werunfc-web** → klik Register app
4. Salin config yang muncul (apiKey, authDomain, dll)
5. Klik Continue to console

## Step 2: Deploy ke Vercel (3 menit)

### Opsi A: Via GitHub (Recommended)
1. Push project ini ke GitHub repository baru
2. Buka https://vercel.com → Sign up / Login
3. Klik **Add New Project** → Import dari GitHub
4. Pilih repository werunfc
5. Di **Environment Variables**, tambahkan semua variabel dari `.env.example`:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - VITE_FIREBASE_DATABASE_URL
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_STORAGE_BUCKET
   - VITE_FIREBASE_MESSAGING_SENDER_ID
   - VITE_FIREBASE_APP_ID
6. Klik **Deploy**

### Opsi B: Via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```
Lalu set env variables di Vercel Dashboard.

## Step 3: Set Security Rules Firebase

Setelah deploy, update rules di Firebase Console:
1. Buka **Realtime Database** → tab **Rules**
2. Ganti dengan:

```json
{
  "rules": {
    "matches": {
      ".read": true,
      ".write": true
    }
  }
}
```

> ⚠️ Rules ini mengizinkan semua orang read/write.
> Untuk production, tambahkan authentication dan restrict write ke admin saja.

## Selesai! 🎉

Website kamu sekarang live di: `https://werunfc.vercel.app`
(atau nama yang kamu pilih)
