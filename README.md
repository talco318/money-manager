# 📊 מערכת ניהול תיק השקעות

מערכת מתקדמת לניהול תיק השקעות עם תמיכה בייבוא עסקאות מברוקר מיטב טרייד, נתוני שוק בזמן אמת, גרפים והשוואה למדד S&P 500.

![Next.js](https://img.shields.io/badge/Next.js-16.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.22-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-cyan)

## ✨ תכונות עיקריות

### 📥 ייבוא עסקאות
- ייבוא אוטומטי מקבצי Excel של מיטב טרייד
- תמיכה בעמודות בעברית (תאריך, סוג פעולה, שם נייר, וכו')
- הוספה ידנית של עסקאות
- זיהוי כפילויות אוטומטי

### 📈 נתוני שוק בזמן אמת
- חיבור ל-Yahoo Finance API
- מחירים עדכניים לכל נייר בתיק
- שער דולר/שקל עדכני
- מטמון חכם (15 דקות) לביצועים אופטימליים

### 📊 דשבורד ראשי
- סיכום תיק: שווי כולל, רווח/הפסד, שינוי יומי
- טבלת אחזקות עם נתונים בזמן אמת
- יתרת מזומן בדולר ושקל
- גישה מהירה לכל הפעולות

### 📉 גרפים ואנליטיקה
- **גרף ביצועים**: מעקב אחר תשואת התיק לאורך זמן
- **השוואה ל-S&P 500**: מדידת ביצועים מול המדד
- **התפלגות תיק**: פאי צ'ארט של חלוקת ההשקעות
- בחירת טווחי זמן: חודש עד 5 שנים

### 🔔 מערכת התראות
- התראות מחיר (מעל/מתחת ליעד)
- התראות אחוז שינוי
- הפעלה/כיבוי מהיר של התראות

### 💰 מעקב דיבידנדים
- סיכום דיבידנדים שהתקבלו
- פירוט לפי חודש ונייר
- חישוב ניכוי מס אוטומטי

### 📋 ניתוח עמלות
- סיכום עמלות ברוקר
- ממוצע עמלה לעסקה
- גרף עמלות לפי חודש

### ⚙️ הגדרות
- בחירת ברוקר ברירת מחדל
- תצוגת מטבע (דולר/שקל/שניהם)
- ייצוא וגיבוי נתונים
- מחיקת נתונים

## 🚀 התקנה

### דרישות מקדימות
- Node.js 18+
- PostgreSQL (או Vercel Postgres)

### התקנה מקומית

```bash
# שכפול הפרויקט
git clone <repository-url>
cd money-manager

# התקנת תלויות
npm install

# הגדרת משתני סביבה
cp .env.example .env
# ערוך את .env והוסף את ה-DATABASE_URL שלך

# יצירת מסד הנתונים
npx prisma db push

# הרצת סביבת פיתוח
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000) בדפדפן.

## 🔧 הגדרת סביבה

צור קובץ `.env` עם המשתנים הבאים:

```env
# Database - Vercel Postgres או PostgreSQL מקומי
DATABASE_URL="postgresql://user:password@host:5432/database"

# לפריסה ב-Vercel (אופציונלי)
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
```

## 📁 מבנה הפרויקט

```
src/
├── app/                    # App Router - דפים ו-API
│   ├── api/               # נתיבי API
│   │   ├── alerts/        # ניהול התראות
│   │   ├── analytics/     # ניתוח דיבידנדים ועמלות
│   │   ├── export/        # ייצוא נתונים
│   │   ├── holdings/      # אחזקות
│   │   ├── market/        # נתוני שוק
│   │   ├── settings/      # הגדרות
│   │   └── transactions/  # עסקאות וייבוא
│   ├── alerts/            # דף התראות
│   ├── analytics/         # דף אנליטיקה
│   ├── charts/            # דף גרפים
│   ├── import/            # דף ייבוא
│   ├── settings/          # דף הגדרות
│   └── transactions/      # דף עסקאות
├── components/            # קומפוננטות React
│   ├── alerts/            # קומפוננטות התראות
│   ├── analytics/         # קומפוננטות אנליטיקה
│   ├── charts/            # גרפים (Recharts)
│   ├── dashboard/         # דשבורד ראשי
│   ├── layout/            # לייאאוט וניווט
│   ├── settings/          # הגדרות
│   ├── transactions/      # עסקאות וייבוא
│   └── ui/                # קומפוננטות UI בסיסיות
├── hooks/                 # Custom React Hooks
│   ├── useAlerts.ts       # ניהול התראות
│   ├── useAnalytics.ts    # נתוני אנליטיקה
│   ├── useChartData.ts    # נתונים לגרפים
│   ├── usePortfolio.ts    # נתוני תיק
│   ├── useSettings.ts     # הגדרות
│   └── useTransactions.ts # עסקאות
├── lib/                   # לוגיקה עסקית
│   ├── excel/             # פרסור Excel מיטב
│   ├── holdings/          # חישוב אחזקות (FIFO)
│   ├── market/            # Yahoo Finance API
│   └── prisma.ts          # Prisma client
└── types/                 # TypeScript types
```

## 🔌 API Reference

### עסקאות
- `GET /api/transactions` - רשימת עסקאות (עם פילטרים)
- `POST /api/transactions` - הוספת עסקה ידנית
- `DELETE /api/transactions?id=xxx` - מחיקת עסקה
- `POST /api/transactions/import` - ייבוא מ-Excel

### אחזקות
- `GET /api/holdings` - רשימת אחזקות עם נתוני שוק
- `POST /api/holdings` - חישוב מחדש של אחזקות

### נתוני שוק
- `GET /api/market?type=quote&symbol=AAPL` - מחיר נייר
- `GET /api/market?type=quotes&symbols=AAPL,MSFT` - מחירי ניירות
- `GET /api/market?type=historical&symbol=AAPL&period=1y` - היסטוריה
- `GET /api/market?type=sp500&period=1y` - היסטוריית S&P 500
- `GET /api/market?type=usdils` - שער דולר/שקל

### התראות
- `GET /api/alerts` - רשימת התראות
- `POST /api/alerts` - יצירת התראה
- `PATCH /api/alerts` - עדכון התראה
- `DELETE /api/alerts?id=xxx` - מחיקת התראה

### אנליטיקה
- `GET /api/analytics?type=dividends&year=2024` - דיבידנדים
- `GET /api/analytics?type=commissions&year=2024` - עמלות

### הגדרות
- `GET /api/settings` - קריאת הגדרות
- `PUT /api/settings` - עדכון הגדרות
- `DELETE /api/settings` - מחיקת כל הנתונים

### ייצוא
- `GET /api/export` - ייצוא כל הנתונים ל-JSON

## 🚢 פריסה ב-Vercel

1. צור חשבון ב-[Vercel](https://vercel.com)
2. חבר את ה-repository שלך
3. הוסף Vercel Postgres מתוך ה-Storage tab
4. Vercel יגדיר אוטומטית את משתני הסביבה
5. Deploy!

### לאחר הפריסה
```bash
# הרץ את המיגרציות
npx prisma db push
```

## 🛠️ טכנולוגיות

- **Framework**: Next.js 16.3 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Database**: PostgreSQL + Prisma 5
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts 3
- **Market Data**: Yahoo Finance API (yahoo-finance2)
- **Excel Parsing**: SheetJS (xlsx)
- **Date Handling**: date-fns

## 📝 רישיון

MIT License - ראה קובץ LICENSE לפרטים.

## 🤝 תרומה

תרומות יתקבלו בברכה! פתחו Issue או Pull Request.

---

נבנה באהבה 🇮🇱
