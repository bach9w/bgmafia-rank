#!/bin/bash

# Отиваме в директорията на проекта
cd "$(dirname "$0")"

# Активираме виртуалната среда ако съществува
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Изпълняваме скрипта
python3 scrape_bgmafia.py

# Деактивираме виртуалната среда ако е била активирана
if [ -n "$VIRTUAL_ENV" ]; then
    deactivate
fi 