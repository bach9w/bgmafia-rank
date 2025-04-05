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
