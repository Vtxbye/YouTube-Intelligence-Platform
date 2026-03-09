import os
from dotenv import load_dotenv, find_dotenv
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv(find_dotenv())

POSTGRES_URL = os.getenv("POSTGRES_URL")

def db_connect(url):
  return psycopg2.connect(url)

def execute(query, params=None, fetch_one=False, fetch_all=False):
  conn = db_connect(POSTGRES_URL)
  cur = conn.cursor(cursor_factory=RealDictCursor)

  try:
    cur.execute(query, params or ())
    if fetch_one:
      result = cur.fetchone()
    elif fetch_all:
      result = cur.fetchall()
    else:
      result = None
    conn.commit()
    return result
  except Exception as e:
    conn.rollback()
    raise e
  finally:
    cur.close()
    conn.close()

def create_tables(path):
  with open(path, "r") as file:
    sql = file.read()
  try:
    execute(sql)
    print("Created tables successfully")
  except Exception as e:
    err_message = str(e)
    print(f"Failed to create tables: {err_message}")

if __name__ == "__main__":
  script_dir = Path(__file__).resolve().parent
  create_file = script_dir / "create.sql"
  create_tables(create_file)