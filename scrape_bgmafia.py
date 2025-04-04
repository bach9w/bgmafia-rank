import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import logging
import os
from pathlib import Path
import yaml
import time
import random

# Създаваме директории за логове и данни ако не съществуват
BASE_DIR = Path(__file__).resolve().parent
LOGS_DIR = BASE_DIR / 'logs'
DATA_DIR = BASE_DIR / 'data'
CONFIG_DIR = BASE_DIR / 'config'
HTML_DIR = BASE_DIR / 'html'

LOGS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)
CONFIG_DIR.mkdir(exist_ok=True)
HTML_DIR.mkdir(exist_ok=True)

# Конфигурираме логването
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOGS_DIR / f'bgmafia_scraper_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler()
    ]
)

def load_config():
    """Зарежда конфигурацията от YAML файл."""
    config_file = CONFIG_DIR / 'config.yaml'
    
    if not config_file.exists():
        # Създаваме примерен конфигурационен файл
        default_config = {
            'headers': {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'priority': 'u=0, i',
                'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-full-version': '"131.0.6778.265"',
                'sec-ch-ua-full-version-list': '"Google Chrome";v="131.0.6778.265", "Chromium";v="131.0.6778.265", "Not_A Brand";v="24.0.0.0"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-model': '""',
                'sec-ch-ua-platform': '"macOS"',
                'sec-ch-ua-platform-version': '"15.3.1"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
            },
            'cookies': {
                'machine_id': '61230140',
                '__utmz': '29123503.1741378123.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)',
                'lc': '1742333984',
                'npc[min_level]': '0',
                'npc[max_level]': '25',
                'cf_clearance': '_Eub.AjOUx75bQfXinqgkLW4jx5TsxibKAIG3lXjkyc-1743361217-1.2.1.1-qbNiK1ZTA6.21arKuWCmbRbmy4nqqCdfyirFS3pmQ097DX7NoLOiPnMCbgtImIGmtrGuKnPGQmtCZalPD55FCHbX._4AZ2z.EAp6EkmK.75DktgX14BmHFCH5Y6n5KkONKP9hdQaRk7JFCBahv7VKmg7fnbkq1YHTT5vD3V1CLB20IMQHDXasnguyIehxITnu6yOZMj1lcUpXOvBd69yIElGwmXJ8naaHrNN0l361GcjRJrN6MBGlvjrChaH_18k2VqaXeqPjgWddrTSn46.sERv3wepmADDaTV6Z.7_Dp9vcAnEUNugqfwtc.DQSSvMvtHwgDtp6iKorJSa9vvJuCIXVbtcp.QbgeR7hP0RIKcZ6SIVqrd9GrN1m.w5ZZhpAEq9KkM4BLT_j3tUL_ICzyEuowliSOAOZGluBrAXjHM',
                'terms_accepted': '1',
                'registered': '1',
                'auth': 'mH%2Bll7iTmWOgobB5X7NaG9w09kTzNsEVLn94k5lkoKGweV%2BzWo2bx6jf1c2mfqN%2FeJOZZaCXsHxq9g%3D%3D',
                'world_id': '4',
                'sess3': '726362ac4d0ad4ef890d75fd2cfba823',
                'login': '1',
                'clickcoords': '1570711',
                'my-application-browser-tab': ''
            }
        }
        
        with open(config_file, 'w', encoding='utf-8') as f:
            yaml.dump(default_config, f, allow_unicode=True)
            
        logging.info(f'Създаден е примерен конфигурационен файл: {config_file}')
        return default_config
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
            logging.info('Конфигурацията е заредена успешно')
            return config
    except Exception as e:
        logging.error(f'Грешка при зареждане на конфигурацията: {e}')
        raise

def save_table_data(html_content, category, page_num, timestamp):
    """Извлича и записва HTML таблица и JSON данни."""
    # Създаваме директорията за категорията
    category_dir = HTML_DIR / category
    category_dir.mkdir(exist_ok=True)
    
    # Записваме HTML файла
    html_file = category_dir / f'{timestamp}_page{page_num}.html'
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    logging.info(f'Запазен HTML файл: {html_file}')
    
    # Извличаме и записваме таблицата
    soup = BeautifulSoup(html_content, 'html.parser')
    default_table = soup.find('table', class_='default')
    
    if default_table:
        # Записваме HTML таблицата
        table_file = category_dir / f'{timestamp}_page{page_num}_table.html'
        with open(table_file, 'w', encoding='utf-8') as f:
            f.write(str(default_table))
        logging.info(f'Запазена таблица: {table_file}')
        
        # Извличаме данните в JSON формат
        table_data = []
        rows = default_table.find_all('tr')
        
        if rows:
            headers = [th.get_text(strip=True) for th in rows[0].find_all('th')]
            
            for row in rows[1:]:  # Пропускаме хедър реда
                cells = row.find_all('td')
                if len(cells) >= len(headers):
                    row_data = {}
                    for i, cell in enumerate(cells):
                        if i < len(headers):
                            row_data[headers[i]] = cell.get_text(strip=True)
                    table_data.append(row_data)
            
            # Записваме JSON файл
            json_dir = DATA_DIR / category
            json_dir.mkdir(exist_ok=True)
            json_file = json_dir / f'{timestamp}_page{page_num}_data.json'
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(table_data, f, ensure_ascii=False, indent=2)
            logging.info(f'Запазени данни в JSON формат: {json_file}')
        
        return len(table_data)
    else:
        logging.warning(f'Не беше намерена таблица в категория {category}, страница {page_num}')
        return 0

def scrape_bgmafia():
    """Основна функция за извличане на данни от bgmafia.com"""
    logging.info("Започване на извличането на данни")
    
    # Точните заглавки от curl заявката
    headers = {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'cache-control': 'max-age=0',
        'priority': 'u=0, i',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-arch': '"x86"',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-full-version': '"131.0.6778.265"',
        'sec-ch-ua-full-version-list': '"Google Chrome";v="131.0.6778.265", "Chromium";v="131.0.6778.265", "Not_A Brand";v="24.0.0.0"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-model': '""',
        'sec-ch-ua-platform': '"macOS"',
        'sec-ch-ua-platform-version': '"15.3.1"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    }
    
    # Точните бисквитки от curl заявката
    cookies = {
        'machine_id': '61230140',
        '__utmz': '29123503.1741378123.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)',
        'lc': '1742333984',
        'npc[min_level]': '18',
        'npc[max_level]': '0',
        'cf_clearance': '_Eub.AjOUx75bQfXinqgkLW4jx5TsxibKAIG3lXjkyc-1743361217-1.2.1.1-qbNiK1ZTA6.21arKuWCmbRbmy4nqqCdfyirFS3pmQ097DX7NoLOiPnMCbgtImIGmtrGuKnPGQmtCZalPD55FCHbX._4AZ2z.EAp6EkmK.75DktgX14BmHFCH5Y6n5KkONKP9hdQaRk7JFCBahv7VKmg7fnbkq1YHTT5vD3V1CLB20IMQHDXasnguyIehxITnu6yOZMj1lcUpXOvBd69yIElGwmXJ8naaHrNN0l361GcjRJrN6MBGlvjrChaH_18k2VqaXeqPjgWddrTSn46.sERv3wepmADDaTV6Z.7_Dp9vcAnEUNugqfwtc.DQSSvMvtHwgDtp6iKorJSa9vvJuCIXVbtcp.QbgeR7hP0RIKcZ6SIVqrd9GrN1m.w5ZZhpAEq9KkM4BLT_j3tUL_ICzyEuowliSOAOZGluBrAXjHM',
        'terms_accepted': '1',
        'registered': '1',
        'auth': 'mH%2Bll7iTmWOgobB5X7NaG9w09kTzNsEVLn94k5lkoKGweV%2BzWo2bx6jf1c2mfqN%2FeJOZZaCXsHxq9g%3D%3D',
        'world_id': '4',
        'sess3': '1e0da9cf4f6b22a97e9d47ee8aa8855c',
        '__utma': '29123503.1751747959.1741378123.1743682978.1743705971.32',
        '__utmt': '1',
        'fight_finder[online]': 'on',
        'fight_finder[min_level]': '22',
        'clickcoords': '0',
        '__utmb': '29123503.94.10.1743705971',
        'my-application-browser-tab': ''
    }

    
    # Дефинираме категориите и техните URL пътища
    categories = {
        'experience': {
            'name': 'Опит',
            'urls': [
                {'url': 'https://bgmafia.com/top10/daily/experience?z=sHo', 'referer': 'https://bgmafia.com/top10/daily?z=P1p'},
                {'url': 'https://bgmafia.com/top10/daily/experience/2?z=sHo', 'referer': 'https://bgmafia.com/top10/daily/experience?z=sHo'},
                {'url': 'https://bgmafia.com/top10/daily/experience/3?z=sHo', 'referer': 'https://bgmafia.com/top10/daily/experience/2?z=sHo'}
            ]
        },
        'fight_wins': {
            'name': 'Победи',
            'urls': [
                {'url': 'https://bgmafia.com/top10/daily/fight_wins?z=tMb', 'referer': 'https://bgmafia.com/top10/daily?z=P1p'},
                {'url': 'https://bgmafia.com/top10/daily/fight_wins/2?z=tMb', 'referer': 'https://bgmafia.com/top10/daily/fight_wins?z=tMb'},
                {'url': 'https://bgmafia.com/top10/daily/fight_wins/3?z=tMb', 'referer': 'https://bgmafia.com/top10/daily/fight_wins/2?z=tMb'}
            ]
        },
        'strength': {
            'name': 'Сила',
            'urls': [
                {'url': 'https://bgmafia.com/top10/daily/strength?z=iMk', 'referer': 'https://bgmafia.com/top10/daily?z=P1p'},
                {'url': 'https://bgmafia.com/top10/daily/strength/2?z=iMk', 'referer': 'https://bgmafia.com/top10/daily/strength?z=iMk'},
                {'url': 'https://bgmafia.com/top10/daily/strength/3?z=iMk', 'referer': 'https://bgmafia.com/top10/daily/strength/2?z=iMk'}
            ]
        },
        'intelect': {
            'name': 'Интелект',
            'urls': [
                {'url': 'https://bgmafia.com/top10/daily/intelect?z=l4J', 'referer': 'https://bgmafia.com/top10/daily?z=P1p'},
                {'url': 'https://bgmafia.com/top10/daily/intelect/2?z=l4J', 'referer': 'https://bgmafia.com/top10/daily/intelect?z=l4J'},
                {'url': 'https://bgmafia.com/top10/daily/intelect/3?z=l4J', 'referer': 'https://bgmafia.com/top10/daily/intelect/2?z=l4J'}
            ]
        },
        'sexapeal': {
            'name': 'Сексапил',
            'urls': [
                {'url': 'https://bgmafia.com/top10/daily/sexapeal?z=kHx', 'referer': 'https://bgmafia.com/top10/daily?z=P1p'},
                {'url': 'https://bgmafia.com/top10/daily/sexapeal/2?z=kHx', 'referer': 'https://bgmafia.com/top10/daily/sexapeal?z=kHx'},
                {'url': 'https://bgmafia.com/top10/daily/sexapeal/3?z=kHx', 'referer': 'https://bgmafia.com/top10/daily/sexapeal/2?z=kHx'}
            ]
        }
    }
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    total_records = 0
    
    try:
        for category_key, category_data in categories.items():
            logging.info(f"Обработка на категория: {category_data['name']}")
            
            for page_num, page_data in enumerate(category_data['urls'], 1):
                # Настройваме хедъри с правилния referer
                current_headers = headers.copy()
                current_headers['referer'] = page_data['referer']
                
                try:
                    # Изпращаме заявката
                    logging.info(f"Изпращане на заявка към: {page_data['url']}")
                    response = requests.get(
                        page_data['url'], 
                        headers=current_headers, 
                        cookies=cookies, 
                        timeout=10
                    )
                    response.raise_for_status()
                    
                    # Записваме страницата и извличаме данните
                    records = save_table_data(response.text, category_key, page_num, timestamp)
                    total_records += records
                    
                    # Кратка пауза между заявките
                    if page_num < len(category_data['urls']):
                        time.sleep(random.uniform(0.5, 1.0))
                
                except requests.exceptions.RequestException as e:
                    logging.error(f"Грешка при заявка към {page_data['url']}: {e}")
                    continue
        
        logging.info(f"Извличането на данни завърши успешно. Общо записи: {total_records}")
        
    except Exception as e:
        logging.error(f"Възникна неочаквана грешка: {e}")
        raise
    
    return total_records

if __name__ == '__main__':
    try:
        records = scrape_bgmafia()
        logging.info(f"Програмата приключи успешно. Общо извлечени записи: {records}")
    except Exception as e:
        logging.error(f"Критична грешка: {e}")
        exit(1) 