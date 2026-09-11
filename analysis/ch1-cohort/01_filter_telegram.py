"""Filter the USC Telegram 2024 dataset to the study window.

Usage:
  python 01_filter_telegram.py --raw /path/to/telegram --out ../../data/derived/telegram_window.parquet
Requires: pip install duckdb

First inspect one file to confirm column names:
  duckdb -c "SELECT * FROM read_parquet('/path/to/telegram/*.parquet') LIMIT 5"
"""
import argparse, duckdb

p = argparse.ArgumentParser()
p.add_argument("--raw", required=True)
p.add_argument("--out", required=True)
p.add_argument("--start", default="2024-09-01")
p.add_argument("--end", default="2024-10-15")
a = p.parse_args()

con = duckdb.connect()
con.execute(f"""
COPY (
  SELECT chat_id, message_id, date, sender_id, text
  FROM read_parquet('{a.raw}/*.parquet')
  WHERE date >= '{a.start}' AND date < '{a.end}' AND text IS NOT NULL
) TO '{a.out}' (FORMAT PARQUET)
""")
print("wrote", a.out)
