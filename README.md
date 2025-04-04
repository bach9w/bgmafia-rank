# BG Mafia HTML Weekly Combiner

Този скрипт комбинира HTML страници от седмичните класации на BG Mafia в един общ HTML файл.

## Изисквания

- Python 3.6+
- BeautifulSoup4 (`pip install beautifulsoup4`)

## Употреба

```bash
python3 combine_html_pages.py [--pages PAGE [PAGE ...]] [--categories CATEGORY [CATEGORY ...]] [--output-dir OUTPUT_DIR]
```

### Параметри

- `--pages`: Номера на страниците, които да се комбинират (по подразбиране: 1 2 3)
- `--categories`: Категориите, които да се обработят (по подразбиране: experience, fight_wins, strength, intelect, sexapeal)
- `--output-dir`: Опционална директория за запазване на резултатите

### Примери

Комбиниране на страници 1, 2 и 3 за всички категории:

```bash
python3 combine_html_pages.py
```

Комбиниране на страници 1 и 2 за категориите experience и strength:

```bash
python3 combine_html_pages.py --pages 1 2 --categories experience strength
```

Запазване на резултатите в определена директория:

```bash
python3 combine_html_pages.py --output-dir ./output
```

## Структура на проекта

```
html-weekly/
  ├── experience/
  │   ├── 20250405_105601_page1.html
  │   ├── 20250405_105601_page1_table.html
  │   ├── 20250405_105601_page2.html
  │   ├── 20250405_105601_page2_table.html
  │   ├── ...
  │   └── combined/
  │       └── 20250405_105601_combined_pages_1-2-3.html
  ├── fight_wins/
  │   └── ...
  ├── strength/
  │   └── ...
  ├── intelect/
  │   └── ...
  └── sexapeal/
      └── ...
```

## Как работи

Скриптът намира всички HTML файлове в указаните категории и ги комбинира в един общ HTML файл. Процесът включва:

1. Намиране на timestamp от имената на файловете
2. Използване на първия файл (page1) като основа
3. Извличане на таблиците от всички указани страници
4. Комбиниране на таблиците, като се запазва само един хедър
5. Актуализиране на заглавието, за да показва комбинираните страници
6. Запазване на резултата в директория "combined"

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Обработка на изображения

Приложението използва OpenAI GPT-4o Vision API за извличане на данни от изображения с класации. Файловете с изображения се обработват директно в паметта, без да се записват на сървъра, което подобрява сигурността и намалява използването на дисково пространство.

Директорията `public/uploads` се използва само за целите на разработката и всички файлове в нея се игнорират от Git чрез `.gitignore` файл.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
