# 🚀 OTTO BITE Shiftlog - Canlıya Alma Rehberi (Vercel)

Uygulamayı internete açmak (yayına almak) için **Vercel** platformunu kullanacağız. Vercel, Next.js uygulamaları için en iyi ve en hızlı platformdur. Ayrıca veritabanı olarak **Vercel Postgres** kullanacağız.

Aşağıdaki adımları sırasıyla takip edin:

## Adım 1: Hazırlık

1.  Bu klasördeki terminalinizde (Terminal ekranında) şu komutu çalıştırın:
    ```bash
    git init
    git add .
    git commit -m "Uygulama yayina hazir"
    ```
    *(Eğer git zaten kurulu ve aktifse hata verebilir, sorun değil, devam edin)*

2.  **GitHub** hesabınıza gidin ve **yeni bir depo (repository)** oluşturun (Örn: `ottobite-shiftlog`).
3.  Oluşturduğunuz deponun bağlantı komutlarını terminalde çalıştırarak kodları GitHub'a yükleyin.

## Adım 2: Vercel Kurulumu

1.  [Vercel.com](https://vercel.com) adresine gidin ve GitHub hesabınızla giriş yapın.
2.  **"Add New..."** -> **"Project"** butonuna tıklayın.
3.  GitHub'daki `ottobite-shiftlog` deponuzu seçin ve **Import** deyin.

## Adım 3: Veritabanı Ayarları (Çok Önemli!)

1.  Vercel'de proje sayfasında **Storage** sekmesine tıklayın.
2.  **"Create Database"** butonuna basın ve **"Postgres"** seçeneğini seçin.
3.  Kurulumu onaylayın. (Bölge olarak Frankfurt veya size en yakın olanı seçebilirsiniz).
4.  Bittiğinde, sol menüden **Settings** -> **Environment Variables** kısmına gidin. Vercel bunları otomatik eklemiş olmalı (`POSTGRES_URL`, `POSTGRES_PRISMA_URL` vb. görmelisiniz).

## Adım 4: Prisma Ayarlarını Güncelleme

Şimdi kodumuzda küçük bir değişiklik yapmamız gerekiyor çünkü SQLite'dan Postgres'e geçiyoruz.

1.  Bilgisayarınızda `prisma/schema.prisma` dosyasını açın.
2.  `datasource db` kısmını şöyle değiştirin:

```prisma
datasource db {
  provider = "postgresql"
  url = env("POSTGRES_PRISMA_URL") // uses connection pooling
  directUrl = env("POSTGRES_URL_NON_POOLING") // uses a direct connection
}
```

3.  Bu değişikliği kaydedin ve GitHub'a gönderin:
    ```bash
    git add .
    git commit -m "Postgres ayari yapildi"
    git push origin master
    ```

## Adım 5: Yayına Alma

GitHub'a "push" yaptığınız anda Vercel otomatik olarak yeni değişikliği algılayacak ve uygulamayı tekrar derleyecektir.

1.  Vercel panelinizde **Deployments** kısmına bakın.
2.  Yeni "Building" işleminin bitmesini bekleyin.
3.  Bittiğinde size `https://ottobite-shiftlog.vercel.app` gibi bir link verecek.

**🎉 Tebrikler! Artık linki müdürünüze gönderebilirsiniz.**

---
**NOT:** Canlı veritabanı (Postgres) boştur. İlk kullanıcıyı oluşturmak için `/register` sayfasına gidip bir Admin hesabı açmanız gerekebilir veya veritabanına doğrudan veri ekleyebilirsiniz.

Eğer takıldığınız bir yer olursa bana sormaktan çekinmeyin!
